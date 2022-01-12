// Copyright 2017-2022, University of Colorado Boulder

/**
 * Readout that appears in the CircuitElementEditContainerNode that displays whether the switch is open or closed.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import { Node } from '../../../scenery/js/imports.js';
import { Text } from '../../../scenery/js/imports.js';
import circuitConstructionKitCommonStrings from '../circuitConstructionKitCommonStrings.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import Circuit from '../model/Circuit.js';
import Switch from '../model/Switch.js';
import Tandem from '../../../tandem/js/Tandem.js';
import TrashButton from './TrashButton.js';
import CircuitElement from '../model/CircuitElement.js';

const theSwitchIsClosedString = circuitConstructionKitCommonStrings.theSwitchIsClosed;
const theSwitchIsOpenString = circuitConstructionKitCommonStrings.theSwitchIsOpen;

// constants
const MAX_TEXT_WIDTH = 300;

class SwitchReadoutNode extends Node {
  constructor( circuit: Circuit, tandem: Tandem, trashButton: TrashButton ) {

    // Create both texts and display both so they remain aligned as the value changes
    const createText = ( string: string ) =>
      new Text( string, {
        fontSize: 24,
        maxWidth: MAX_TEXT_WIDTH
      } );
    const closedText = createText( theSwitchIsClosedString );
    const openText = createText( theSwitchIsOpenString );

    const maxWidth = Math.max( closedText.width, openText.width );

    const closedListener = ( closed: boolean ) => {
      closedText.visible = closed;
      openText.visible = !closed;
    };

    // This is reused across all switches
    circuit.selectedCircuitElementProperty.link( ( newCircuitElement: CircuitElement | null, oldCircuitElement: CircuitElement | null ) => {
      oldCircuitElement instanceof Switch && oldCircuitElement.closedProperty.unlink( closedListener );
      newCircuitElement instanceof Switch && newCircuitElement.closedProperty.link( closedListener );
    } );

    // Show a trash button to the right of the text
    trashButton.mutate( {
      left: maxWidth + 10,
      centerY: closedText.centerY
    } );

    super( {
      children: [ closedText, openText, trashButton ]
    } );
  }
}

circuitConstructionKitCommon.register( 'SwitchReadoutNode', SwitchReadoutNode );
export default SwitchReadoutNode;