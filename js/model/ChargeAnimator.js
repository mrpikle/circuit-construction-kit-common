// Copyright 2016-2017, University of Colorado Boulder

/**
 * This code governs the movement of charges, making sure they are distributed equally among the different
 * CircuitElements.  This exists for the life of the sim and hence does not need a dispose implementation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var circuitConstructionKitCommon = require( 'CIRCUIT_CONSTRUCTION_KIT_COMMON/circuitConstructionKitCommon' );
  var CircuitConstructionKitCommonConstants = require( 'CIRCUIT_CONSTRUCTION_KIT_COMMON/CircuitConstructionKitCommonConstants' );
  var inherit = require( 'PHET_CORE/inherit' );
  var NumberProperty = require( 'AXON/NumberProperty' );
  var RunningAverage = require( 'DOT/RunningAverage' );
  var Util = require( 'DOT/Util' );

  // constants

  // If the current is lower than this, then there is no charge movement
  var MINIMUM_CURRENT = 1E-3;

  // The furthest an charge can step in one frame before the time scale must be reduced (to prevent a strobe effect)
  var MAX_POSITION_CHANGE = CircuitConstructionKitCommonConstants.CHARGE_SEPARATION * 0.43;

  // Number of times to spread out charges so they don't get bunched up.
  var NUMBER_OF_EQUALIZE_STEPS = 2;

  // Factor that multiplies the current to attain speed in screen coordinates per second
  // No longer manually tuned so that at 1 Amp, 1 charge flows past in 1 second
  var SPEED_SCALE = 25;

  // the highest allowable time step for integration
  var MAX_DT = 1 / 30;

  /**
   * Gets the absolute value of the current in a circuit element.
   * @param {CircuitElement} circuitElement
   * @returns {number}
   * @constructor
   */
  var CURRENT_MAGNITUDE = function( circuitElement ) {
    return Math.abs( circuitElement.currentProperty.get() );
  };

  /**
   * Returns an object that indicates a position in a circuit element and can compute the charge density in that
   * circuit element, so we can find the one with the lowest density and move the charge there.
   *
   * @param {Circuit} circuit - the entire circuit
   * @param {CircuitElement} circuitElement - the circuit element
   * @param {number} distance - the distance along the circuit element
   * @returns {Object} combining circuitElement, distance and density
   */
  var createCircuitLocation = function( circuit, circuitElement, distance ) {
    assert && assert( _.isNumber( distance ), 'distance should be a number' );
    assert && assert( circuitElement.containsScalarLocation( distance ), 'circuitElement should contain distance' );
    var density = circuit.getChargesInCircuitElement( circuitElement ).length / circuitElement.chargePathLength;

    // If there are no charges in that circuit because it is a short segment, average the density by looking at
    // downstream neighbors
    if ( density === 0 && circuitElement.chargePathLength < 30 ) {
      var distanceFromStart = Math.abs( distance );
      var distanceFromEnd = Math.abs( circuitElement.chargePathLength - distance );

      // Note it is reversed because we want to check current downstream
      var selectedVertex = distanceFromStart < distanceFromEnd ?
                           circuitElement.endVertexProperty.get() :
                           circuitElement.startVertexProperty.get();
      var neighbors = circuit.getNeighborCircuitElements( selectedVertex );
      var densities = neighbors.map( function( neighbor ) {
        return circuit.getChargesInCircuitElement( neighbor ).length / neighbor.chargePathLength;
      } );
      density = _.sum( densities ) / densities.length;
    }
    return {
      circuitElement: circuitElement,
      distance: distance,
      density: density
    };
  };

  /**
   * @param {Circuit} circuit
   * @constructor
   */
  function ChargeAnimator( circuit ) {

    // @private (read-only) {ObservableArray.<Charge>} - the ObservableArray of Charge instances
    this.charges = circuit.charges;

    // @private (read-only) {Circuit} - the Circuit
    this.circuit = circuit;

    // @private (read-only) {number} - factor that reduces the overall propagator speed when maximum speed is exceeded
    this.scale = 1;

    // @public {RunningAverage} - a running average over last time steps as a smoothing step
    this.timeScaleRunningAverage = new RunningAverage( 30 );

    // @public (read-only) {NumberProperty} - how much the time should be slowed, 1 is full speed, 0.5 is running at
    // half speed, etc.
    this.timeScaleProperty = new NumberProperty( 1, { range: { min: 0, max: 1 } } );
  }

  circuitConstructionKitCommon.register( 'ChargeAnimator', ChargeAnimator );

  return inherit( Object, ChargeAnimator, {

    /**
     * Restores to the initial state
     * @public
     */
    reset: function() {
      this.timeScaleProperty.reset();
      this.timeScaleRunningAverage.clear();
    },

    /**
     * Update the location of the charges based on the circuit currents
     * @param {number} dt - elapsed time in seconds
     * @public
     */
    step: function( dt ) {

      if ( this.charges.length === 0 || this.circuit.circuitElements.length === 0 ) {
        return;
      }

      // dt would ideally be around 16.666ms = 0.0166 sec.  Cap it to avoid too large of an integration step.
      dt = Math.min( dt, MAX_DT );

      // Find the fastest current in any circuit element
      var maxCurrentMagnitude = CURRENT_MAGNITUDE( _.maxBy( this.circuit.circuitElements.getArray(), CURRENT_MAGNITUDE ) );
      assert && assert( maxCurrentMagnitude >= 0, 'max current should be positive' );

      var maxSpeed = maxCurrentMagnitude * SPEED_SCALE;
      var maxPositionChange = maxSpeed * MAX_DT; // Use the max dt instead of the true dt to avoid fluctuations

      // Slow down the simulation if the fastest step distance exceeds the maximum allowed step
      this.scale = ( maxPositionChange >= MAX_POSITION_CHANGE ) ? ( MAX_POSITION_CHANGE / maxPositionChange ) : 1;

      // Average over scale values to smooth them out
      var averageScale = Util.clamp( this.timeScaleRunningAverage.updateRunningAverage( this.scale ), 0, 1 );
      this.timeScaleProperty.set( averageScale );

      for ( var i = 0; i < this.charges.length; i++ ) {
        var charge = this.charges.get( i );

        // Don't update charges in chargeLayoutDirty circuit elements, because they will get a relayout anyways
        if ( !charge.circuitElement.chargeLayoutDirty ) {
          this.propagate( charge, dt );
        }
      }

      // Spread out the charges so they don't bunch up
      for ( i = 0; i < NUMBER_OF_EQUALIZE_STEPS; i++ ) {
        this.equalizeAll( dt );
      }

      // After computing the new charge positions (possibly across several deltas), trigger the views to update.
      this.charges.forEach( function( charge ) {
        charge.updatePositionAndAngle();
      } );
    },

    /**
     * Make the charges repel each other so they don't bunch up.
     * @param {number} dt - the elapsed time in seconds
     * @private
     */
    equalizeAll: function( dt ) {

      // Update them in a stochastic order to avoid systematic sources of error building up.
      var indices = phet.joist.random.shuffle( _.range( this.charges.length ) );
      for ( var i = 0; i < this.charges.length; i++ ) {
        var charge = this.charges.get( indices[ i ] );

        // No need to update charges in chargeLayoutDirty circuit elements, they will be replaced anyways.  Skipping
        // chargeLayoutDirty circuitElements improves performance.  Also, only update electrons in circuit elements
        // that have a current (to improve performance)
        if ( !charge.circuitElement.chargeLayoutDirty && Math.abs( charge.circuitElement.currentProperty.get() ) >= MINIMUM_CURRENT ) {
          this.equalizeCharge( charge, dt );
        }
      }
    },

    /**
     * Adjust the charge so it is more closely centered between its neighbors.  This prevents charges from getting
     * too bunched up.
     * @param {Charge} charge - the charge to adjust
     * @param {number} dt - seconds
     * @private
     */
    equalizeCharge: function( charge, dt ) {

      var circuitElementCharges = this.circuit.getChargesInCircuitElement( charge.circuitElement );

      // if it has a lower and upper neighbor, nudge the charge to be closer to the midpoint
      var sorted = _.sortBy( circuitElementCharges, 'distance' );

      var chargeIndex = sorted.indexOf( charge );
      var upper = sorted[ chargeIndex + 1 ];
      var lower = sorted[ chargeIndex - 1 ];

      // Only adjust a charge if it is between two other charges
      if ( upper && lower ) {
        var neighborSeparation = upper.distance - lower.distance;
        var currentPosition = charge.distance;

        var desiredPosition = lower.distance + neighborSeparation / 2;
        var distanceFromDesiredPosition = Math.abs( desiredPosition - currentPosition );
        var sameDirectionAsCurrent = Math.sign( desiredPosition - currentPosition ) ===
                                     Math.sign( charge.circuitElement.currentProperty.get() * charge.charge );

        // never slow down or run the current backwards
        if ( sameDirectionAsCurrent ) {

          // When we need to correct in the same direction as current flow, do it quickly.
          var correctionStepSize = Math.abs( 5.5 / NUMBER_OF_EQUALIZE_STEPS * SPEED_SCALE * dt );

          // If far enough away that it won't overshoot, then correct it with one step
          if ( distanceFromDesiredPosition > correctionStepSize ) {

            // move in the appropriate direction maxDX
            if ( desiredPosition < currentPosition ) {
              desiredPosition = currentPosition - correctionStepSize;
            }
            else if ( desiredPosition > currentPosition ) {
              desiredPosition = currentPosition + correctionStepSize;
            }
          }

          // Only update the charge if its new position would be within the same circuit element.
          if ( desiredPosition >= 0 && desiredPosition <= charge.circuitElement.chargePathLength ) {
            charge.distance = desiredPosition;
          }
        }
      }
    },

    /**
     * Move the charge forward in time by the specified amount.
     * @param {Charge} charge - the charge to update
     * @param {number} dt - elapsed time in seconds
     * @private
     */
    propagate: function( charge, dt ) {
      var chargePosition = charge.distance;
      assert && assert( _.isNumber( chargePosition ), 'distance along wire should be a number' );
      var current = charge.circuitElement.currentProperty.get() * charge.charge;

      // Below min current, the charges should remain stationary
      if ( Math.abs( current ) > MINIMUM_CURRENT ) {
        var speed = current * SPEED_SCALE;
        var chargePositionDelta = speed * dt * this.scale;
        var newChargePosition = chargePosition + chargePositionDelta;

        // Step within a single circuit element
        if ( charge.circuitElement.containsScalarLocation( newChargePosition ) ) {
          charge.distance = newChargePosition;
        }
        else {

          // move to a new CircuitElement
          var overshoot = current < 0 ?
                          -newChargePosition :
                          ( newChargePosition - charge.circuitElement.chargePathLength );
          var isUnder = newChargePosition < 0;

          assert && assert( !isNaN( overshoot ), 'overshoot should be a number' );
          assert && assert( overshoot >= 0, 'overshoot should be >=0' );

          // enumerate all possible circuit elements the charge could go to
          var circuitLocations = this.getLocations( charge, overshoot, isUnder );
          if ( circuitLocations.length > 0 ) {

            // choose the CircuitElement with the lowest density
            var chosenCircuitLocation = _.minBy( circuitLocations, 'density' );
            assert && assert( chosenCircuitLocation.distance >= 0, 'position should be >=0' );
            charge.circuitElement = chosenCircuitLocation.circuitElement;
            charge.distance = chosenCircuitLocation.distance;
          }
        }
      }
    },

    /**
     * Returns the locations where a charge can flow to (connected circuits with current flowing in the right direction)
     * @param {Charge} charge - the charge that is moving
     * @param {number} overshoot - the distance the charge should appear along the next circuit element
     * @param {boolean} under - determines whether the charge will be at the start or end of the circuit element
     * @returns {Object[]} see createCircuitLocation
     * @private
     */
    getLocations: function( charge, overshoot, under ) {
      var vertex = under ?
                   charge.circuitElement.startVertexProperty.get() :
                   charge.circuitElement.endVertexProperty.get();
      var adjacentCircuitElements = this.circuit.getNeighborCircuitElements( vertex );
      var circuitLocations = [];

      // Keep only those with outgoing current.
      for ( var i = 0; i < adjacentCircuitElements.length; i++ ) {
        var neighbor = adjacentCircuitElements[ i ];
        var current = neighbor.currentProperty.get() * charge.charge;
        var distAlongNew = null;

        // The linear algebra solver can result in currents of 1E-12 where it should be zero.  For these cases, don't
        // permit charges to flow. The current is clamped here instead of after the linear algebra so that we don't
        // mess up support for oscillating elements that may need the small values such as capacitors and inductors.
        if ( current > MINIMUM_CURRENT && neighbor.startVertexProperty.get() === vertex ) {

          // Start near the beginning.
          distAlongNew = Util.clamp( overshoot, 0, neighbor.chargePathLength );
        }
        else if ( current < -MINIMUM_CURRENT && neighbor.endVertexProperty.get() === vertex ) {

          // start near the end
          distAlongNew = Util.clamp( neighbor.chargePathLength - overshoot, 0, neighbor.chargePathLength );
        }
        else {

          // Current too small to animate
        }
        distAlongNew && circuitLocations.push( createCircuitLocation( this.circuit, neighbor, distAlongNew ) );
      }
      return circuitLocations;
    }
  } );
} );