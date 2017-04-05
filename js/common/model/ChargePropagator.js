// Copyright 2016, University of Colorado Boulder
// TODO: Review, document, annotate, i18n, bring up to standards

/**
 * This code governs the movement of charges, making sure they are distributed equally among the different CircuitElements.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var circuitConstructionKitCommon = require( 'CIRCUIT_CONSTRUCTION_KIT_COMMON/circuitConstructionKitCommon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var RunningAverage = require( 'CIRCUIT_CONSTRUCTION_KIT_COMMON/common/model/RunningAverage' );
  var CircuitConstructionKitConstants = require( 'CIRCUIT_CONSTRUCTION_KIT_COMMON/CircuitConstructionKitConstants' );
  var NumberProperty = require( 'AXON/NumberProperty' );

  // constants

  // If the current is lower than this, then there is no charge movement
  var MIN_CURRENT = Math.pow( 10, -10 );

  // The furthest an charge can step in one frame before the time scale must be reduced (to prevent a strobe effect)
  var MAX_POSITION_CHANGE = CircuitConstructionKitConstants.CHARGE_SEPARATION * 0.43;

  // Number of times to spread out charges so they don't get bunched up.
  var NUMBER_OF_EQUALIZE_STEPS = 2;

  // Factor that multiplies the current to attain speed in screen coordinates per second
  var SPEED_SCALE = 100 / 3;

  /**
   * Sets the charge to not update its position, so that we may apply batch changes without impacting performance
   * @param {Charge} charge
   * @constructor
   */
  var DISABLE_UPDATES = function( charge ) {
    charge.updatingPositionProperty.set( false );
  };

  /**
   * Sets the charge to update its position after a batch of changes has been made.
   * @param {Charge} charge
   * @constructor
   */
  var ENABLE_UPDATES = function( charge ) {
    charge.updatingPositionProperty.set( true );
  };

  /**
   * Gets the absolute value of the current in a circuit element.
   * @param {CircuitElement} circuitElement
   * @return {number}
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
   * @return {Object} combining circuitElement, distance and density
   */
  var createCircuitLocation = function( circuit, circuitElement, distance ) {
    assert && assert( _.isNumber( distance ), 'distance should be a number' );
    assert && assert( circuitElement.containsScalarLocation( distance ), 'circuitElement should contain distance' );
    return {
      circuitElement: circuitElement,
      distance: distance,
      density: circuit.getChargesInCircuitElement( circuitElement ).length / circuitElement.chargePathLength
    };
  };

  /**
   * @param {Circuit} circuit
   * @constructor
   */
  function ChargePropagator( circuit ) {

    // @private (read-only) the ObservableArray of Charge instances
    this.charges = circuit.charges;

    // @private (read-only) the Circuit
    this.circuit = circuit;

    // @private (read-only) factor that reduces the overall propagator speed when maximum speed is exceeded
    this.scale = 1;

    // @private (read-only) a running average over last time steps
    this.timeScaleRunningAverage = new RunningAverage( 30 );

    // @public (read-only)
    this.timeScaleProperty = new NumberProperty( 1, { range: { min: 0, max: 1 } } ); // 1 is full speed, 0.5 is running at half speed, etc.
  }

  circuitConstructionKitCommon.register( 'ChargePropagator', ChargePropagator );

  return inherit( Object, ChargePropagator, {

    /**
     * Update the location of the charges based on the circuit currents
     * @param {number} dt - elapsed time in seconds
     * @public
     */
    step: function( dt ) {

      // Disable incremental updates to improve performance.  The ChargeNodes are only updated once, instead of
      // incrementally many times throughout this update
      this.charges.forEach( DISABLE_UPDATES );

      // dt would ideally be around 16.666ms = 0.0166 sec.  Cap it to avoid too large of an integration step.
      dt = Math.min( dt, 1 / 30 );

      // Find the fastest current in any circuit element
      var maxCurrentMagnitude = _.max( this.circuit.circuitElements.getArray().map( CURRENT_MAGNITUDE ) );
      var maxSpeed = maxCurrentMagnitude * SPEED_SCALE;
      var maxPositionChange = maxSpeed * dt;

      // Slow down the simulation if the fastest step distance exceeds the maximum allowed step
      this.scale = maxPositionChange >= MAX_POSITION_CHANGE ? MAX_POSITION_CHANGE / maxPositionChange : 1;

      // Average over scale values to smooth them out
      var averageScale = this.timeScaleRunningAverage.updateRunningAverage( this.scale );
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
      this.charges.forEach( ENABLE_UPDATES );
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
        // chargeLayoutDirty circuitElements improves performance
        if ( !charge.circuitElement.chargeLayoutDirty ) {
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
      var sorted = _.sortBy( circuitElementCharges, function( e ) { return e.distanceProperty.get(); } );

      var chargeIndex = sorted.indexOf( charge );
      var upper = sorted[ chargeIndex + 1 ];
      var lower = sorted[ chargeIndex - 1 ];

      // Only adjust a charge if it is between two other charges
      if ( upper && lower ) {
        var neighborSeparation = upper.distanceProperty.get() - lower.distanceProperty.get();
        var chargePosition = charge.distanceProperty.get();

        var desiredPosition = lower.distanceProperty.get() + neighborSeparation / 2;
        var distanceToMove = Math.abs( desiredPosition - chargePosition );
        var sameDirectionAsCurrent = (desiredPosition - chargePosition) > 0 && charge.circuitElement.currentProperty.get() * charge.charge > 0;
        var correctionSpeed = (sameDirectionAsCurrent ? 5.5 : 1) / NUMBER_OF_EQUALIZE_STEPS * SPEED_SCALE;
        var maxAllowedStepSize = Math.abs( correctionSpeed * dt );

        // TODO: this sign seems wrong
        if ( distanceToMove > maxAllowedStepSize ) {

          // move in the appropriate direction maxDX
          if ( desiredPosition < chargePosition ) {
            desiredPosition = chargePosition - maxAllowedStepSize;
          }
          else if ( desiredPosition > chargePosition ) {
            desiredPosition = chargePosition + maxAllowedStepSize;
          }
        }
        if ( desiredPosition >= 0 && desiredPosition <= charge.circuitElement.chargePathLength ) {
          charge.distanceProperty.set( desiredPosition );
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
      var x = charge.distanceProperty.get();
      assert && assert( _.isNumber( x ), 'distance along wire should be a number' );
      var current = charge.circuitElement.currentProperty.get() * charge.charge;

      if ( Math.abs( current ) < MIN_CURRENT ) {
        return;
      }

      var speed = current * SPEED_SCALE;
      var dx = speed * dt;
      dx *= this.scale;
      var newX = x + dx;
      var circuitElement = charge.circuitElement;
      if ( circuitElement.containsScalarLocation( newX ) ) {
        charge.distanceProperty.set( newX );
      }
      else {

        // need a new CircuitElement
        var overshoot = 0;
        var under = false;
        if ( newX < 0 ) {
          overshoot = -newX;
          under = true;
        }
        else {

          // TODO: better abstraction for the following line
          overshoot = Math.abs( circuitElement.chargePathLength - newX );
          under = false;
        }
        assert && assert( !isNaN( overshoot ), 'overshoot is NaN' );
        assert && assert( overshoot >= 0, 'overshoot is <0' );
        var circuitLocations = this.getLocations( charge, overshoot, under );
        if ( circuitLocations.length > 0 ) {

          // choose the CircuitElement with the furthest away charge
          var chosenCircuitLocation = _.minBy( circuitLocations, 'density' );
          charge.setLocation( chosenCircuitLocation.circuitElement, Math.abs( chosenCircuitLocation.distance ) );
        }
      }
    },

    /**
     * Returns the locations where a charge can flow to
     * @param {Charge} charge
     * @param {number} overshoot
     * @param {boolean} under
     * @return {Object[]} see createCircuitLocation
     * @private
     */
    getLocations: function( charge, overshoot, under ) {
      var circuitElement = charge.circuitElement;
      var vertex = under ? circuitElement.startVertexProperty.get() : circuitElement.endVertexProperty.get();
      var adjacentCircuitElements = this.circuit.getNeighborCircuitElements( vertex );
      var circuitLocations = [];

      //keep only those with outgoing current.
      for ( var i = 0; i < adjacentCircuitElements.length; i++ ) {
        var neighbor = adjacentCircuitElements[ i ];
        var current = neighbor.currentProperty.get() * charge.charge;
        var distAlongNew = null;

        // The linear algebra solver can result in currents of 1E-12 where it should be zero.  For these cases, don't
        // permit charges to flow.
        // TODO: Should the current be clamped after linear algebra?
        var THRESHOLD = 1E-8;
        if ( current > THRESHOLD && neighbor.startVertexProperty.get() === vertex ) {//start near the beginning.
          distAlongNew = overshoot;
          if ( distAlongNew > neighbor.chargePathLength ) {
            distAlongNew = neighbor.chargePathLength;
          }
          else if ( distAlongNew < 0 ) {
            distAlongNew = 0;
          }
          circuitLocations.push( createCircuitLocation( this.circuit, neighbor, distAlongNew ) );
        }
        else if ( current < -THRESHOLD && neighbor.endVertexProperty.get() === vertex ) {
          distAlongNew = neighbor.chargePathLength - overshoot;
          if ( distAlongNew > neighbor.chargePathLength ) {
            distAlongNew = neighbor.chargePathLength;
          }
          else if ( distAlongNew < 0 ) {
            distAlongNew = 0;
          }
          circuitLocations.push( createCircuitLocation( this.circuit, neighbor, distAlongNew ) );
        }
      }
      return circuitLocations;
    }
  } );
} );