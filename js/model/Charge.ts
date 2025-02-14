// Copyright 2016-2022, University of Colorado Boulder

/**
 * The model for a single blue charge that moves along a circuit element, depicted as a colored sphere.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Emitter from '../../../axon/js/Emitter.js';
import Property from '../../../axon/js/Property.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import CircuitElement from './CircuitElement.js';

class Charge {

  //the amount of charge
  readonly charge: number;
  circuitElement: CircuitElement;
  distance: number;
  readonly matrix: Matrix3;
  readonly visibleProperty: Property<boolean>;
  readonly changedEmitter: Emitter<[]>;
  readonly disposeEmitterCharge: Emitter<[]>;

  /**
   * @param circuitElement - the circuit element the charge is in.
   * @param distance - how far along the circuit element it has traveled (in screen coordinates)
   * @param visibleProperty - whether the charge should be shown.
   * @param charge - +1 for conventional current and -1 for electrons
   */
  constructor( circuitElement: CircuitElement, distance: number, visibleProperty: Property<boolean>, charge: number ) {

    assert && assert( charge === 1 || charge === -1, 'charge should be 1 or -1' );

    this.charge = charge;

    // Validate inputs
    assert && assert( _.isNumber( distance ), 'distance should be a number' );
    assert && assert( distance >= 0, 'charge was below the origin of the circuit element' );
    assert && assert( circuitElement.containsScalarPosition( distance ), 'charge was not within the circuit element' );

    // @public (read-only) {CircuitElement} - the CircuitElement the Charge is in, changed by Charge.updatePositionAndAngle
    this.circuitElement = circuitElement;

    // @public (read-only) {number} - the distance the charge has traveled in its CircuitElement in view coordinates
    this.distance = distance;

    // @public (read-only) {Matrix3} - rotation and translation for the charge
    this.matrix = Matrix3.identity();

    // @public (read-only) {Property.<boolean>} - whether the charge should be displayed
    this.visibleProperty = visibleProperty;

    // @public (read-only) {Emitter} Indicate when the position and/or angle changed
    this.changedEmitter = new Emitter();

    // @public (read-only) {Emitter} send notifications when the charge is disposed, so the view can be disposed.
    this.disposeEmitterCharge = new Emitter();

    this.updatePositionAndAngle();
  }

  /**
   * After updating the circuit element and/or distance traveled, update the 2d position and direction.
   */
  updatePositionAndAngle() {
    assert && assert( !isNaN( this.distance ), 'charge position was not a number' );
    this.circuitElement.updateMatrixForPoint( this.distance, this.matrix );

    // Notify listeners that the position and angle have changed.
    this.changedEmitter.emit();
  }

  // Dispose the charge when it will never be used again.
  dispose() {
    this.disposeEmitterCharge.emit();
    this.disposeEmitterCharge.removeAllListeners();
    this.changedEmitter.dispose();
  }
}

circuitConstructionKitCommon.register( 'Charge', Charge );
export default Charge;
