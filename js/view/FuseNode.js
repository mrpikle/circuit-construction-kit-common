// Copyright 2019-2020, University of Colorado Boulder

/**
 * This node shows a fuse.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Matrix3 from '../../../dot/js/Matrix3.js';
import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import Shape from '../../../kite/js/Shape.js';
import merge from '../../../phet-core/js/merge.js';
import Image from '../../../scenery/js/nodes/Image.js';
import Node from '../../../scenery/js/nodes/Node.js';
import Path from '../../../scenery/js/nodes/Path.js';
import Rectangle from '../../../scenery/js/nodes/Rectangle.js';
import Color from '../../../scenery/js/util/Color.js';
import fuseImage from '../../images/fuse_png.js';
import CCKCConstants from '../CCKCConstants.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import Fuse from '../model/Fuse.js';
import FixedCircuitElementNode from './FixedCircuitElementNode.js';
import FuseTripAnimation from './FuseTripAnimation.js';
import SchematicType from './SchematicType.js';
import schematicTypeProperty from './schematicTypeProperty.js';

// constants
const SCHEMATIC_STEM_WIDTH = 20;
const HORIZONTAL_ZIG_ZAG_DISTANCE = 5;
const VERTICAL_ZIG_ZAG_HEIGHT = 4;
const CAP_WIDTH = 15; // horizontal size of each cap in the image
const SPLIT_DY = 13; // in view coordinates, amplitude of the zig-zag pattern when the fuse is tripped
const SPLIT_DX = 8; // in view coordinates, half the distance of the split part of the fuse when tripped
const VERTICAL_GLASS_MARGIN = 3;
const DEFAULT_GLASS_FILL = '#c3dbfd';

class FuseNode extends FixedCircuitElementNode {

  /**
   * @param {CCKCScreenView|null} screenView - main screen view, null for isIcon
   * @param {CircuitLayerNode|null} circuitLayerNode, null for isIcon
   * @param {Fuse} fuse
   * @param {Property.<CircuitElementViewType>} viewTypeProperty
   * @param {Tandem} tandem
   * @param {Object} [options]
   */
  constructor( screenView, circuitLayerNode, fuse, viewTypeProperty, tandem, options ) {

    assert && assert( fuse instanceof Fuse, 'fuse should be a Fuse' );

    options = merge( { isIcon: false, useHitTestForSensors: true }, options );

    const fuseImageNode = new Image( fuseImage, { scale: 0.691 } );
    const numberOfZigZags = ( fuseImageNode.width - CAP_WIDTH * 2 ) / HORIZONTAL_ZIG_ZAG_DISTANCE / 2;

    // zig-zag shape
    const startPoint = new Vector2( CAP_WIDTH, 0 );
    const endPoint = new Vector2( fuseImageNode.width - CAP_WIDTH, 0 );
    const filamentShape = new Shape().moveToPoint( startPoint )
      .zigZagToPoint( endPoint, VERTICAL_ZIG_ZAG_HEIGHT, Utils.roundSymmetric( numberOfZigZags ), false );

    const brokenFilamentShape = new Shape().moveToPoint( startPoint )
      .zigZagToPoint( new Vector2( fuseImageNode.width / 2 - SPLIT_DX, SPLIT_DY ), VERTICAL_ZIG_ZAG_HEIGHT, Utils.roundSymmetric( numberOfZigZags / 2 ) - 1, false );
    brokenFilamentShape.moveToPoint( endPoint );
    brokenFilamentShape
      .zigZagToPoint( new Vector2( fuseImageNode.width / 2 + SPLIT_DX, -SPLIT_DY ), VERTICAL_ZIG_ZAG_HEIGHT, Utils.roundSymmetric( numberOfZigZags / 2 ) - 1, false );

    const filamentPath = new Path( filamentShape, {
      stroke: '#302b2b',
      lineWidth: 4,
      center: fuseImageNode.center
    } );

    // Fuse filament thickness is proportional to its current rating
    const updateFilamentPathLineWidth = currentRating => filamentPath.setLineWidth( Utils.linear(
      fuse.currentRatingProperty.range.min, fuse.currentRatingProperty.range.max, 1, 4, currentRating
    ) );
    fuse.currentRatingProperty.link( updateFilamentPathLineWidth );

    // Glass covering
    const glassNode = new Rectangle( CAP_WIDTH, VERTICAL_GLASS_MARGIN, fuseImageNode.width - CAP_WIDTH * 2, fuseImageNode.height - VERTICAL_GLASS_MARGIN * 2, {
      fill: DEFAULT_GLASS_FILL,
      opacity: 0.5,
      stroke: 'black',
      lineWidth: 0.5
    } );

    const lifelikeFuseNode = new Node( {
      children: [ filamentPath, glassNode, fuseImageNode ]
    } );

    // Schematic view is a line with a box around it, looks the same whether tripped or untripped.
    const boxHeight = 30;
    const boxWidth = fuse.chargePathLength - SCHEMATIC_STEM_WIDTH * 2;
    let schematicShape = new Shape()
      .moveTo( 0, 0 )
      .lineToRelative( fuse.chargePathLength, 0 )
      .moveTo( 0, 0 )
      .rect( SCHEMATIC_STEM_WIDTH, -boxHeight / 2, boxWidth, boxHeight );

    // Icons should appear the same in the toolbox, see
    // https://github.com/phetsims/circuit-construction-kit-common/issues/389
    const width = options.isIcon ? CCKCConstants.RESISTOR_LENGTH : fuse.distanceBetweenVertices;
    lifelikeFuseNode.mutate( { scale: width / lifelikeFuseNode.width } );

    const scale = lifelikeFuseNode.width / schematicShape.bounds.width;
    schematicShape = schematicShape.transformed( Matrix3.scale( scale, scale ) );
    const schematicNode = new Path( schematicShape, {
      stroke: Color.BLACK,
      lineWidth: CCKCConstants.SCHEMATIC_LINE_WIDTH
    } );

    ///// IEC fuse: also a box with two horizontal leads (left and right) and two small vertical lines on the inside
    // (see https://github.com/phetsims/circuit-construction-kit-common/issues/429 for a figure)

    const boxLength7th = boxWidth / 7;
    const fuseIEC = new Shape()
      .moveTo( 0, schematicShape.bounds.centerY )

      // left horizontal lead
      .lineToRelative( SCHEMATIC_STEM_WIDTH, 0 )

      // upper half of the box
      .lineToRelative( 0, -boxHeight / 2 )
      .lineToRelative( boxWidth, 0 )
      .lineToRelative( 0, boxHeight / 2 )

      // right horizontal lead
      .lineToRelative( SCHEMATIC_STEM_WIDTH, 0 )

      // go back along the right horizontal lead
      .lineToRelative( -SCHEMATIC_STEM_WIDTH, 0 )

      // lower half og the box
      .lineToRelative( 0, boxHeight / 2 )
      .lineToRelative( -boxWidth, 0 )

      // small left vertical line. Place it at x = boxLength / 7 (seems to be visually a good place)
      .lineToRelative( 0, -boxHeight )
      .lineToRelative( boxLength7th, 0 )
      .lineToRelative( 0, boxHeight )

      /* small right vertical line: the 1st 'lineToRelative' below takes to starting point, at the cost
      of drawing a line on an already existing one. */
      .lineToRelative( boxWidth - 2 * boxLength7th, 0 )
      .lineToRelative( 0, -boxHeight );

    const updateSchematicType = schematicType => {
      schematicNode.shape = ( schematicType === SchematicType.IEEE || schematicType === SchematicType.BRITISH ) ? schematicShape :
                            fuseIEC;
    };
    schematicTypeProperty.link( updateSchematicType );

    // Center vertically to match the FixedCircuitElementNode assumption that origin is center left
    schematicNode.centerY = 0;
    lifelikeFuseNode.centerY = 0;

    // Expand the pointer areas with a defensive copy, see
    // https://github.com/phetsims/circuit-construction-kit-common/issues/310
    schematicNode.mouseArea = schematicNode.bounds.shiftedY( schematicNode.height / 2 );
    schematicNode.touchArea = schematicNode.bounds.shiftedY( schematicNode.height / 2 );

    super( screenView, circuitLayerNode, fuse, viewTypeProperty, lifelikeFuseNode, schematicNode, tandem, options );

    // @public (read-only) {Fuse} the fuse depicted by this node
    this.fuse = fuse;

    // Update the look when the fuse is tripped
    const updateTripped = isTripped => {
      if ( isTripped ) {
        circuitLayerNode.addChild( new FuseTripAnimation( { center: this.center } ) );
      }
      glassNode.fill = isTripped ? '#4e4e4e' : DEFAULT_GLASS_FILL;
      filamentPath.shape = isTripped ? brokenFilamentShape : filamentShape;
    };
    if ( !options.isIcon ) {
      this.fuse.isTrippedProperty.link( updateTripped );
    }

    // @private
    this.disposeFuseNode = () => {
      lifelikeFuseNode.dispose();
      fuse.currentRatingProperty.unlink( updateFilamentPathLineWidth );
      if ( !options.isIcon ) {
        this.fuse.isTrippedProperty.unlink( updateTripped );
      }
      schematicTypeProperty.unlink( updateSchematicType );
    };
  }

  /**
   * Dispose the FuseNode when it will no longer be used.
   * @public
   * @override
   */
  dispose() {
    this.disposeFuseNode();
    super.dispose();
  }
}

/**
 * Identifies the images used to render this node so they can be prepopulated in the WebGL sprite sheet.
 * @public {Array.<Image>}
 */
FuseNode.webglSpriteNodes = [
  new Image( fuseImage )
];

circuitConstructionKitCommon.register( 'FuseNode', FuseNode );
export default FuseNode;