// Copyright 2016-2022, University of Colorado Boulder

/**
 * Model for the Ammeter, which adds the probe position and current readout.  There is only one ammeter per screen and
 * it is shown/hidden.  Hence it does not need a dispose() implementation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../../axon/js/Property.js';
import Vector2 from '../../../dot/js/Vector2.js';
import Vector2Property from '../../../dot/js/Vector2Property.js';
import Tandem from '../../../tandem/js/Tandem.js';
import NullableIO from '../../../tandem/js/types/NullableIO.js';
import NumberIO from '../../../tandem/js/types/NumberIO.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import Meter from './Meter.js';

class Ammeter extends Meter {

  // the full-precision reading on the ammeter. It will be formatted for display in the view.  Null means the ammeter is not on a wire.
  readonly currentProperty: Property<number | null>;

  // the position of the tip of the probe
  readonly probePositionProperty: Property<Vector2>;

  constructor( tandem: Tandem, phetioIndex: number ) {
    super( tandem, phetioIndex );

    this.currentProperty = new Property<number | null>( null, {
      tandem: tandem.createTandem( 'currentProperty' ),
      units: 'A',
      phetioType: Property.PropertyIO( NullableIO( NumberIO ) )
    } );

    this.probePositionProperty = new Vector2Property( Vector2.ZERO, {
      tandem: tandem.createTandem( 'probePositionProperty' )
    } );
  }

  // Restore the ammeter to its initial conditions
  reset() {
    super.reset();
    this.currentProperty.reset();
    this.probePositionProperty.reset();
  }
}

circuitConstructionKitCommon.register( 'Ammeter', Ammeter );
export default Ammeter;