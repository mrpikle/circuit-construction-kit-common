// Copyright 2015-2021, University of Colorado Boulder

/**
 * Named CCKCLightBulbNode to avoid collisions with SCENERY_PHET/LightBulbNode. Renders the bulb shape
 * and brightness lines. Note that the socket is rendered in LightBulbSocketNode.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import NumberProperty from '../../../axon/js/NumberProperty.js';
import Property from '../../../axon/js/Property.js';
import Matrix3 from '../../../dot/js/Matrix3.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import Shape from '../../../kite/js/Shape.js';
import merge from '../../../phet-core/js/merge.js';
import { Image } from '../../../scenery/js/imports.js';
import { Node } from '../../../scenery/js/imports.js';
import { Path } from '../../../scenery/js/imports.js';
import { Color } from '../../../scenery/js/imports.js';
import lightBulbMiddleHigh_png from '../../mipmaps/lightBulbMiddleHigh_png.js';
import lightBulbMiddleReal_png from '../../mipmaps/lightBulbMiddleReal_png.js';
import lightBulbFrontReal_png from '../../images/lightBulbFrontReal_png.js';
import lightBulbMiddle_png from '../../mipmaps/lightBulbMiddle_png.js';
import CCKCConstants from '../CCKCConstants.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import CustomLightBulbNode from './CustomLightBulbNode.js';
import FixedCircuitElementNode, { FixedCircuitElementNodeOptions } from './FixedCircuitElementNode.js';
import LightBulbSocketNode from './LightBulbSocketNode.js';
import schematicTypeProperty from './schematicTypeProperty.js';
import CCKCScreenView from './CCKCScreenView.js';
import CircuitLayerNode from './CircuitLayerNode.js';
import LightBulb from '../model/LightBulb.js';
import CircuitElementViewType from '../model/CircuitElementViewType.js';
import Tandem from '../../../tandem/js/Tandem.js';
import SchematicType from './SchematicType.js';

// constants
const SCRATCH_MATRIX = new Matrix3();

// The height from the vertex to the center of the light bulb schematic circle
const LEAD_Y = -73;

// The "blip" in the filament that looks like an upside down "u" semicircle
const INNER_RADIUS = 5;

/**
 * Determine the brightness for a given power
 * @param {number} multiplier - steepness of the function
 * @param {number} power - the power through the light bulb
 * @returns {number}
 */
const toBrightness = ( multiplier: number, power: number ) => {
  const maximumBrightness = 1;

  // power at which the brightness becomes 1
  const maximumPower = 2000;
  return Math.log( 1 + power * multiplier ) * maximumBrightness / Math.log( 1 + maximumPower * multiplier );
};

class CCKCLightBulbNode extends FixedCircuitElementNode {
  private readonly rayNodeContainer: Node;
  private readonly disposeCircuitConstructionKitLightBulbNode: () => void;
  private readonly socketNode: LightBulbSocketNode | null;

  /**
   * @param {CCKCScreenView|null} screenView - main screen view, null for icon
   * @param {CircuitLayerNode|null} circuitLayerNode, null for icon
   * @param {LightBulb} lightBulb - the light bulb model
   * @param {Property.<boolean>} showResultsProperty - true if the sim can display values
   * @param {Property.<CircuitElementViewType>} viewTypeProperty
   * @param {Tandem} tandem
   * @param {Object} [providedOptions]
   */
  constructor( screenView: CCKCScreenView | null, circuitLayerNode: CircuitLayerNode | null, lightBulb: LightBulb,
               showResultsProperty: Property<boolean>, viewTypeProperty: Property<CircuitElementViewType>, tandem: Tandem, providedOptions?: Partial<FixedCircuitElementNodeOptions> ) {
    let filledOptions = merge( {
      isIcon: false,
      useHitTestForSensors: true
    }, providedOptions ) as FixedCircuitElementNodeOptions;
    const brightnessProperty = new NumberProperty( 0 );
    const updateBrightness = Property.multilink(
      [ lightBulb.currentProperty, showResultsProperty, lightBulb.resistanceProperty ],
      ( current: number, running: boolean, resistance: number ) => {
        const power = Math.abs( current * current * resistance );

        let brightness = toBrightness( 0.35, power );

        // Workaround for SCENERY_PHET/LightBulbNode which shows highlight even for current = 1E-16, so clamp it off
        // see https://github.com/phetsims/scenery-phet/issues/225
        if ( brightness < 1E-6 ) {
          brightness = 0;
        }

        brightnessProperty.value = Utils.clamp( brightness, 0, 1 );
      } );
    let lightBulbNode: Node = new CustomLightBulbNode( brightnessProperty, {
      real: lightBulb.real
    } );

    // The isIcon must show the socket as well
    if ( filledOptions.isIcon ) {
      lightBulbNode = new Image( lightBulb.highResistance ? lightBulbMiddleHigh_png :
                                 lightBulb.real ? lightBulbMiddleReal_png :
                                 lightBulbMiddle_png, { scale: 0.37 } );

      // tack on the socket
      if ( lightBulb.real ) {
        lightBulbNode.addChild( new Image( lightBulbFrontReal_png ) );
      }
    }

    // General filledOptions used throughout bulb node
    filledOptions = merge( {

      // Override the dimensions of the bulb node because the invisible rays contribute to the bounds. Used to set up
      // the highlight region.
      contentWidth: 3.6,
      contentHeight: 11
    }, filledOptions ) as FixedCircuitElementNodeOptions;

    // Schematic creation begins here.
    const endPosition = lightBulb.endPositionProperty.get();
    const startPosition = lightBulb.startPositionProperty.get();
    const delta = endPosition.minus( startPosition );

    const rightLeadX = delta.x;
    const schematicCircleRadius = delta.x / 2;

    /**
     * Adds the schematic circle with filament to the given Shape.
     * @param {Shape} shape
     * @returns Shape
     */
    const addIEEESchematicCircle = ( shape: Shape ) => shape

      // Outer circle
      .moveTo( 0, LEAD_Y )
      .arc( rightLeadX / 2, LEAD_Y, schematicCircleRadius, Math.PI, -Math.PI, true )

      // Filament
      .moveTo( 0, LEAD_Y )
      .arc( schematicCircleRadius, LEAD_Y, INNER_RADIUS, Math.PI, 0, false )
      .lineTo( rightLeadX, LEAD_Y );

    const schematicCircleDiameter = 2 * schematicCircleRadius;
    const cosPi4 = Math.cos( Math.PI / 4 );
    const sinPi4 = Math.sin( Math.PI / 4 );

    const addIECSchematicCircle = ( shape: Shape ) => shape

      .moveTo( 0, LEAD_Y )

      // the circle
      .arc( rightLeadX / 2, LEAD_Y, schematicCircleRadius, Math.PI, -Math.PI, true )

      // go to circle center to draw the 'x' (2 crossed lines) inside it.
      // Addition of 0.5 seems to visually work better!
      .moveTo( schematicCircleRadius + 0.5, LEAD_Y )

      // a line from center to circumference
      .lineToRelative( schematicCircleRadius * cosPi4, -schematicCircleRadius * sinPi4 )

      // continue the line to the other side of the circle
      .lineToRelative( -schematicCircleDiameter * cosPi4, schematicCircleDiameter * sinPi4 )

      // repeat to draw the other line at 90 degrees to the first
      .moveTo( schematicCircleRadius, LEAD_Y )
      .lineToRelative( -schematicCircleRadius * cosPi4, -schematicCircleRadius * sinPi4 )
      .lineToRelative( schematicCircleDiameter * cosPi4, schematicCircleDiameter * sinPi4 );

    const addLeads = ( shape: Shape ) => shape

      // Left lead
      .moveTo( 0, 0 )
      .lineTo( 0, LEAD_Y )

      // Right lead
      .moveTo( rightLeadX, LEAD_Y )
      .lineTo( rightLeadX, delta.y );
    const ieeeShapeWithLeads = addLeads( addIEEESchematicCircle( new Shape() ) );
    const iecShapeWithLeads = addLeads( addIECSchematicCircle( new Shape() ) );

    const ieeeShapeIcon = addIEEESchematicCircle( new Shape() ).transformed( Matrix3.scaling( 1.75 ) );
    const iecShapeIcon = addIECSchematicCircle( new Shape() ).transformed( Matrix3.scaling( 1.75 ) );

    const schematicNode = new Path( ieeeShapeIcon, {
      stroke: Color.BLACK,
      lineWidth: filledOptions.isIcon ? 4 : CCKCConstants.SCHEMATIC_LINE_WIDTH
    } );

    if ( filledOptions.isIcon ) {
      schematicNode.center = lightBulbNode.center.plusXY( 0, 22 );
    }

    const updateSchematicType = ( schematicType: SchematicType ) => {
      if ( filledOptions.isIcon ) {
        schematicNode.shape = schematicType === 'ieee' ? ieeeShapeIcon : iecShapeIcon;
      }
      else {
        schematicNode.shape = schematicType === 'ieee' ? ieeeShapeWithLeads : iecShapeWithLeads;
      }
    };
    schematicTypeProperty.link( updateSchematicType );

    // Expand the pointer areas with a defensive copy, see https://github.com/phetsims/circuit-construction-kit-common/issues/310
    if ( !filledOptions.isIcon ) {
      schematicNode.mouseArea = schematicNode.bounds.dilated( 2 );
      schematicNode.touchArea = schematicNode.mouseArea;
    }

    super(
      screenView,
      circuitLayerNode,
      lightBulb,
      viewTypeProperty,
      lightBulbNode,
      schematicNode,
      tandem,
      filledOptions
    );

    // @private {Node} - node that contains the light rays so they can be easily positioned
    this.rayNodeContainer = new Node( {

      // @ts-ignore
      children: lightBulbNode.raysNode ? [ lightBulbNode.raysNode ] : [] // keep centering and translation
    } );

    let viewListener: ( ( view: CircuitElementViewType ) => void ) | null = null;
    if ( circuitLayerNode ) {

      // @private - Render the socket node in the front
      this.socketNode = new LightBulbSocketNode(
        screenView,
        circuitLayerNode,
        lightBulb,
        viewTypeProperty,
        tandem.createTandem( 'socketNode' ),
        filledOptions
      );
      viewListener = ( view: CircuitElementViewType ) => {
        this.rayNodeContainer.visible = view === 'lifelike';
      };
      viewTypeProperty.link( viewListener );
      circuitLayerNode && !lightBulb.phetioIsArchetype && circuitLayerNode.lightBulbSocketLayer.addChild( this.socketNode );

      // Light rays are supposed to be behind everything else,
      // see https://github.com/phetsims/circuit-construction-kit-common/issues/161
      circuitLayerNode && circuitLayerNode.addChildToBackground( this.rayNodeContainer );
    }
    else {
      this.socketNode = null;
    }

    // @private {function}
    this.disposeCircuitConstructionKitLightBulbNode = () => {
      updateBrightness.dispose();
      if ( this.socketNode ) {
        this.socketNode && circuitLayerNode && circuitLayerNode.lightBulbSocketLayer.removeChild( this.socketNode );

        // Light rays are supposed to be behind everything else,
        // see https://github.com/phetsims/circuit-construction-kit-common/issues/161
        circuitLayerNode && circuitLayerNode.removeChildFromBackground( this.rayNodeContainer );
        viewTypeProperty.unlink( viewListener! );
        this.socketNode.dispose();
        schematicTypeProperty.unlink( updateSchematicType );
      }
      else {
        assert && assert( false, 'socketNode should be defined' );
      }
    };
  }

  /**
   * Multiple updates may happen per frame, they are batched and updated once in the view step to improve performance.
   * @override
   * @protected - CCKCLightBulbNode calls updateRender for its child socket node
   */
  updateRender() {
    const startPosition = this.circuitElement.startPositionProperty.get();
    const endPosition = this.circuitElement.endPositionProperty.get();
    const angle = Vector2.getAngleBetweenVectors( startPosition, endPosition ) + Math.PI / 4;

    // Update the node transform in a single step, see #66
    SCRATCH_MATRIX.setToTranslationRotationPoint( startPosition, angle );
    this.contentNode.setMatrix( SCRATCH_MATRIX );
    this.rayNodeContainer.setMatrix( SCRATCH_MATRIX );
    this.highlightNode && this.highlightNode.setMatrix( SCRATCH_MATRIX );

    this.socketNode && this.socketNode.updateRender();
  }

  /**
   * Dispose when no longer used.
   * @public
   * @override
   */
  dispose() {
    this.disposeCircuitConstructionKitLightBulbNode();
    super.dispose();
  }

  /**
   * Maintain the opacity of the brightness lines while changing the opacity of the light bulb itself.
   * @override
   * @public
   */
  updateOpacityOnInteractiveChange() {

    // TODO (black-box-study): Make the light bulb images look faded out.
  }
}

circuitConstructionKitCommon.register( 'CCKCLightBulbNode', CCKCLightBulbNode );
export default CCKCLightBulbNode;