// Copyright 2017-2022, University of Colorado Boulder

/**
 * AccordionBox that is customized with constants for Circuit Construction Kit.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Denzell Barnett (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import merge from '../../../phet-core/js/merge.js';
import optionize from '../../../phet-core/js/optionize.js';
import { HBox } from '../../../scenery/js/imports.js';
import { Node } from '../../../scenery/js/imports.js';
import { HStrut } from '../../../scenery/js/imports.js';
import { Text } from '../../../scenery/js/imports.js';
import AccordionBox, { AccordionBoxOptions } from '../../../sun/js/AccordionBox.js';
import Tandem from '../../../tandem/js/Tandem.js';
import CCKCConstants from '../CCKCConstants.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';

// constants
const BUTTON_MARGIN = 8;

type SelfOptions = {
  strutWidth?: number
};
type CCKCAccordionBoxOptions = SelfOptions & AccordionBoxOptions;

class CCKCAccordionBox extends AccordionBox {

  /**
   * @param content - the content to display in the accordion box when it is expanded
   * @param title - the text to display in the title bar
   * @param tandem
   * @param [providedOptions]
   */
  constructor( content: Node, title: string, tandem: Tandem, providedOptions?: CCKCAccordionBoxOptions ) {

    const options = optionize<CCKCAccordionBoxOptions, SelfOptions, AccordionBoxOptions>( {
      strutWidth: 10
    }, providedOptions );

    super( content, merge( {
      fill: CCKCConstants.PANEL_COLOR,
      cornerRadius: CCKCConstants.CORNER_RADIUS,
      titleXMargin: 10,
      buttonXMargin: BUTTON_MARGIN,
      buttonYMargin: BUTTON_MARGIN,
      titleYMargin: 4,
      titleXSpacing: 14,
      contentYSpacing: 0,
      lineWidth: CCKCConstants.PANEL_LINE_WIDTH,
      minWidth: CCKCConstants.RIGHT_SIDE_PANEL_MIN_WIDTH,
      expandedProperty: new BooleanProperty( false, {
        tandem: tandem.createTandem( 'expandedProperty' )
      } ),

      // Expand touch area to match the margins
      expandCollapseButtonOptions: {
        touchAreaYDilation: BUTTON_MARGIN,
        touchAreaXDilation: BUTTON_MARGIN
      },
      titleNode: new HBox( {
        children: [
          new HStrut( options.strutWidth ),
          new Text( title, {
            fontSize: CCKCConstants.FONT_SIZE,
            maxWidth: 175,
            tandem: tandem.createTandem( 'titleNode' )
          } )
        ]
      } ),
      tandem: tandem
    }, options ) );
  }
}

circuitConstructionKitCommon.register( 'CCKCAccordionBox', CCKCAccordionBox );
export type { CCKCAccordionBoxOptions };
export default CCKCAccordionBox;