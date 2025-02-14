// Copyright 2016-2022, University of Colorado Boulder

/**
 * This control panel shows checkboxes for "Show Electrons", etc.  Exists for the life of the sim and hence does not
 * require a dispose implementation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import ElectronChargeNode from '../../../scenery-phet/js/ElectronChargeNode.js';
import { AlignBox } from '../../../scenery/js/imports.js';
import { AlignGroup } from '../../../scenery/js/imports.js';
import { HBox } from '../../../scenery/js/imports.js';
import { Text } from '../../../scenery/js/imports.js';
import { VBox } from '../../../scenery/js/imports.js';
import CCKCConstants from '../CCKCConstants.js';
import circuitConstructionKitCommonStrings from '../circuitConstructionKitCommonStrings.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import CCKCCheckbox from './CCKCCheckbox.js';
import CCKCPanel from './CCKCPanel.js';
import ConventionalCurrentArrowNode from './ConventionalCurrentArrowNode.js';
import Property from '../../../axon/js/Property.js';
import Stopwatch from '../../../scenery-phet/js/Stopwatch.js';
import Tandem from '../../../tandem/js/Tandem.js';
import CurrentType from '../model/CurrentType.js';
import VerticalAquaRadioButtonGroup from '../../../sun/js/VerticalAquaRadioButtonGroup.js';

const conventionalString = circuitConstructionKitCommonStrings.conventional;
const electronsString = circuitConstructionKitCommonStrings.electrons;
const labelsString = circuitConstructionKitCommonStrings.labels;
const showCurrentString = circuitConstructionKitCommonStrings.showCurrent;
const stopwatchString = circuitConstructionKitCommonStrings.stopwatch;
const valuesString = circuitConstructionKitCommonStrings.values;

// constants
const TEXT_OPTIONS = {
  fontSize: CCKCConstants.FONT_SIZE,
  maxWidth: 120
};
const BOX_ALIGNMENT = { xAlign: 'left' as const };
const SPACING = 10;
const LEFT_MARGIN = 30;

class DisplayOptionsPanel extends CCKCPanel {
  readonly stopwatchCheckbox: CCKCCheckbox | null;

  /**
   * @param {AlignGroup} alignGroup - box for aligning with other controls
   * @param {Property.<boolean>} showCurrentProperty - true if current should be shown
   * @param {Property.<boolean>} currentTypeProperty - true if current should be shown as electrons or conventional
   * @param {Property.<boolean>} showValuesProperty - true if values should be shown
   * @param {Property.<boolean>} showLabelsProperty - true if toolbox labels should be shown
   * @param {Stopwatch} stopwatch
   * @param {boolean} showStopwatchCheckbox - true if stopwatch should be shown
   * @param {Tandem} tandem
   */
  constructor( alignGroup: AlignGroup, showCurrentProperty: Property<boolean>, currentTypeProperty: Property<CurrentType>, showValuesProperty: Property<boolean>, showLabelsProperty: Property<boolean>,
               stopwatch: Stopwatch, showStopwatchCheckbox: boolean, tandem: Tandem ) {

    const textIconSpacing = 11;

    // Align the Electrons/Conventional text and radio buttons
    const currentTypeRadioButtonLabelGroup = new AlignGroup();

    const electronsBox = new HBox( {
      children: [
        currentTypeRadioButtonLabelGroup.createBox( new Text( electronsString, TEXT_OPTIONS ), BOX_ALIGNMENT ),

        // Match the size to the play area electrons, see https://github.com/phetsims/circuit-construction-kit-dc/issues/154
        new ElectronChargeNode( { scale: 0.75 } )
      ],
      spacing: textIconSpacing
    } );

    const conventionalBox = new HBox( {
      children: [
        currentTypeRadioButtonLabelGroup.createBox( new Text( conventionalString, TEXT_OPTIONS ), BOX_ALIGNMENT ),
        new ConventionalCurrentArrowNode( tandem.createTandem( 'arrowNode' ) )
      ],
      spacing: textIconSpacing
    } );

    const currentTypeRadioButtonGroup = new VerticalAquaRadioButtonGroup<CurrentType>( currentTypeProperty, [ {
      value: CurrentType.ELECTRONS,
      node: electronsBox,
      tandemName: 'electronsRadioButton'
    }, {
      value: CurrentType.CONVENTIONAL,
      node: conventionalBox,
      tandemName: 'conventionalRadioButton'
    }
    ], {
      tandem: tandem.createTandem( 'currentTypeRadioButtonGroup' ),
      spacing: 6
    } );

    // Gray out current view options when current is not selected.
    showCurrentProperty.linkAttribute( currentTypeRadioButtonGroup, 'enabled' );

    const showLabelsCheckbox = new CCKCCheckbox( new Text( labelsString, TEXT_OPTIONS ), showLabelsProperty, {
      tandem: tandem.createTandem( 'labelsCheckbox' )
    } );
    const showValuesCheckbox = new CCKCCheckbox( new Text( valuesString, TEXT_OPTIONS ), showValuesProperty, {
      tandem: tandem.createTandem( 'valuesCheckbox' )
    } );

    let stopwatchCheckbox = null;
    if ( showStopwatchCheckbox ) {
      stopwatchCheckbox = new CCKCCheckbox( new Text( stopwatchString, TEXT_OPTIONS ), stopwatch.isVisibleProperty, {
        tandem: tandem.createTandem( 'stopwatchCheckbox' )
      } );
    }

    const children = [

      // Show Current and sub-checkboxes
      new VBox( {
        align: 'left',
        spacing: 8,
        children: [
          new CCKCCheckbox( new Text( showCurrentString, TEXT_OPTIONS ), showCurrentProperty, {
            tandem: tandem.createTandem( 'showCurrentCheckbox' )
          } ),
          new AlignBox( // TODO: is alignbox needed here?
            currentTypeRadioButtonGroup, {
              leftMargin: LEFT_MARGIN
            }
          )
        ]
      } ),
      showLabelsCheckbox,
      showValuesCheckbox,
      ...( showStopwatchCheckbox ? [ stopwatchCheckbox! ] : [] )
    ];

    super( alignGroup.createBox( new VBox( {
      children: children,
      spacing: SPACING,
      align: 'left'
    } ), {

      // left align within the box
      xAlign: 'left'
    } ), tandem, {
      yMargin: 10
    } );

    // Touch & Mouse area extends to the right across the control panel
    showLabelsCheckbox.touchArea = showLabelsCheckbox.localBounds.dilatedXY( 5, SPACING / 2 ).withMaxX( this.bounds.width - LEFT_MARGIN );
    showLabelsCheckbox.mouseArea = showLabelsCheckbox.touchArea;

    showValuesCheckbox.touchArea = showValuesCheckbox.localBounds.dilatedXY( 5, SPACING / 2 ).withMaxX( this.bounds.width - LEFT_MARGIN );
    showValuesCheckbox.mouseArea = showValuesCheckbox.touchArea;

    if ( showStopwatchCheckbox && stopwatchCheckbox ) {
      stopwatchCheckbox.touchArea = stopwatchCheckbox.localBounds.dilatedXY( 5, SPACING / 2 ).withMaxX( this.bounds.width - LEFT_MARGIN );
      stopwatchCheckbox.mouseArea = stopwatchCheckbox.touchArea;
    }

    // @public (read-only) {CCKCCheckbox|null} - So the stopwatch can be shown near the checkbox
    this.stopwatchCheckbox = stopwatchCheckbox;
  }
}

circuitConstructionKitCommon.register( 'DisplayOptionsPanel', DisplayOptionsPanel );
export default DisplayOptionsPanel;