// Copyright 2017-2020, University of Colorado Boulder

/**
 * Controls for showing and changing the wire resistivity.  Exists for the life of the sim and hence does not require a
 * dispose implementation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Range from '../../../dot/js/Range.js';
import Text from '../../../scenery/js/nodes/Text.js';
import VBox from '../../../scenery/js/nodes/VBox.js';
import HSlider from '../../../sun/js/HSlider.js';
import CCKCConstants from '../CCKCConstants.js';
import circuitConstructionKitCommonStrings from '../circuitConstructionKitCommonStrings.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';

const lotsString = circuitConstructionKitCommonStrings.lots;
const tinyString = circuitConstructionKitCommonStrings.tiny;
const wireResistivityString = circuitConstructionKitCommonStrings.wireResistivity;

// constants
const TICK_LABEL_TEXT_OPTIONS = { fontSize: 12, maxWidth: 45 };

// Chosen so that current through battery+long wire+long wire+resistor would match prior version, see https://github.com/phetsims/circuit-construction-kit-common/issues/553
const MAX_RESISTIVITY = 0.0168;

class WireResistivityControl extends VBox {

  /**
   * @param {Property.<number>} wireResistivityProperty
   * @param {AlignGroup} alignGroup - for alignment with other controls
   * @param {Object} titleConfig
   * @param {Tandem} tandem
   */
  constructor( wireResistivityProperty, alignGroup, titleConfig, tandem ) {

    const titleNode = new Text( wireResistivityString, titleConfig );

    const slider = new HSlider( wireResistivityProperty, new Range(
      CCKCConstants.DEFAULT_RESISTIVITY,
      MAX_RESISTIVITY // large enough so that max resistance in a 9v battery slows to a good rate
    ), {
      trackSize: CCKCConstants.SLIDER_TRACK_SIZE,
      thumbSize: CCKCConstants.THUMB_SIZE,
      majorTickLength: CCKCConstants.MAJOR_TICK_LENGTH,
      tandem: tandem.createTandem( 'slider' )
    } );

    slider.addMajorTick( 0, new Text( tinyString, TICK_LABEL_TEXT_OPTIONS ) );
    slider.addMajorTick( MAX_RESISTIVITY, new Text( lotsString, TICK_LABEL_TEXT_OPTIONS ) );

    super( {
      children: [ titleNode, slider ]
    } );
  }
}

circuitConstructionKitCommon.register( 'WireResistivityControl', WireResistivityControl );
export default WireResistivityControl;