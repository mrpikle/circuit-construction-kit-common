// Copyright 2016-2020, University of Colorado Boulder

/**
 * The user interface component with a single probe which reads current values from Wires (not from Vertex or
 * FixedCircuitElement instances). Exists for the life of the sim and hence does not require a dispose implementation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import Vector2 from '../../../dot/js/Vector2.js';
import Vector2Property from '../../../dot/js/Vector2Property.js';
import merge from '../../../phet-core/js/merge.js';
import ProbeNode from '../../../scenery-phet/js/ProbeNode.js';
import WireNode from '../../../scenery-phet/js/WireNode.js';
import DragListener from '../../../scenery/js/listeners/DragListener.js';
import Image from '../../../scenery/js/nodes/Image.js';
import Node from '../../../scenery/js/nodes/Node.js';
import Rectangle from '../../../scenery/js/nodes/Rectangle.js';
import Color from '../../../scenery/js/util/Color.js';
import Tandem from '../../../tandem/js/Tandem.js';
import ammeterBodyImage from '../../images/ammeter-body_png.js';
import CCKCConstants from '../CCKCConstants.js';
import CCKCUtils from '../CCKCUtils.js';
import circuitConstructionKitCommonStrings from '../circuitConstructionKitCommonStrings.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import ProbeTextNode from './ProbeTextNode.js';

const currentString = circuitConstructionKitCommonStrings.current;
const questionMarkString = circuitConstructionKitCommonStrings.questionMark;

// constants
// measurements for the cubic curve for the wire nodes
const BODY_LEAD_Y = -30; // in model=view coordinates
const PROBE_LEAD_Y = 15; // in model=view coordinates
const HANDLE_WIDTH = 50;

// overall scale factor for the body and probe
const SCALE_FACTOR = 0.5;

// unsigned measurements for the circles on the voltmeter body image, for where the probe wires connect
const PROBE_CONNECTION_POINT_DY = 8;

class AmmeterNode extends Node {

  /**
   * @param {Ammeter} ammeter
   * @param {CircuitLayerNode|null} circuitLayerNode - for getting the currents, or null if rendering an icon
   * @param {Object} [options]
   */
  constructor( ammeter, circuitLayerNode, options ) {
    options = merge( {

      // true if it will be used as a toolbox icon
      isIcon: false,

      // allowable drag bounds in view coordinates
      visibleBoundsProperty: null,

      // For some CCK Black Box modes, when the user makes a change, the results are hidden
      showResultsProperty: new BooleanProperty( true ),

      // For the black box study, there is a different current threshold in the readout
      blackBoxStudy: false,

      tandem: Tandem.REQUIRED
    }, options );
    const tandem = options.tandem;

    const wireBodyPositionProperty = new Vector2Property( new Vector2( 0, 0 ) );
    const wireProbePositionProperty = new Vector2Property( new Vector2( 0, 0 ) );
    const wireNode = new WireNode(
      wireBodyPositionProperty,
      new Vector2Property( new Vector2( 0, BODY_LEAD_Y ) ),
      wireProbePositionProperty,
      new Vector2Property( new Vector2( 0, PROBE_LEAD_Y ) ), {
        stroke: Color.BLACK,
        lineWidth: 3,
        pickable: false
      }
    );

    const currentReadoutProperty = new DerivedProperty( [ ammeter.currentProperty ], function( current ) {

      const max = options.blackBoxStudy ? 1E3 : 1E10;
      const maxString = options.blackBoxStudy ? '> 10^3' : '> 10^10';

      // Ammeters in this sim only show positive values, not direction (which is arbitrary anyways)
      return current === null ? questionMarkString :
             Math.abs( current ) > max ? maxString :
             CCKCUtils.createCurrentReadout( current );
    } );

    const probeTextNode = new ProbeTextNode(
      currentReadoutProperty, options.showResultsProperty, currentString, tandem.createTandem( 'probeTextNode' ), {
        centerX: ammeterBodyImage.width / 2,
        centerY: ammeterBodyImage.height / 2 + 7 // adjust for the top notch design
      } );

    const bodyNode = new Image( ammeterBodyImage, {
      scale: SCALE_FACTOR,
      cursor: 'pointer',
      children: [ probeTextNode ]
    } );

    const probeNode = new ProbeNode( {
      cursor: 'pointer',
      sensorTypeFunction: ProbeNode.crosshairs(),
      scale: SCALE_FACTOR,
      handleWidth: HANDLE_WIDTH,
      color: '#2c2c2b', // The dark gray border
      innerRadius: 43,

      // Add a decoration on the handle to match the color scheme
      children: [
        new Rectangle( 0, 52, HANDLE_WIDTH * 0.72, 19, {
          cornerRadius: 6,
          centerX: 0,
          fill: '#e79547' // Match the orange of the ammeter image
        } )
      ]
    } );

    assert && assert( !options.hasOwnProperty( 'children' ), 'children will be supplied by AmmeterNode' );
    options.children = [ bodyNode, wireNode, probeNode ];

    super( options );

    // @public (read-only) {ProbeNode}
    this.probeNode = probeNode;

    // @public (read-only) {Ammeter} - the model associated with this view
    this.ammeter = ammeter;

    const alignProbeToBody = () => {
      if ( ammeter.draggingProbesWithBodyProperty.get() ) {

        const constrain = pt => options.visibleBoundsProperty ?
                                options.visibleBoundsProperty.value.eroded( CCKCConstants.DRAG_BOUNDS_EROSION ).closestPointTo( pt ) :
                                pt;

        ammeter.probePositionProperty.set( constrain( ammeter.bodyPositionProperty.value.plusXY( 40, -80 ) ) );
      }
    };

    // When the body position changes, update the body node and the wire
    ammeter.bodyPositionProperty.link( bodyPosition => {
      bodyNode.centerTop = bodyPosition;
      wireBodyPositionProperty.value = bodyNode.centerTop.plusXY( 0, PROBE_CONNECTION_POINT_DY );
      alignProbeToBody();
    } );

    // When the probe position changes, update the probe node and the wire
    ammeter.probePositionProperty.link( probePosition => {
      this.probeNode.centerTop = probePosition;
      wireProbePositionProperty.value = this.probeNode.centerBottom;
    } );

    if ( !options.isIcon ) {

      // Show the ammeter in the play area when dragged from toolbox
      ammeter.visibleProperty.linkAttribute( this, 'visible' );
      ammeter.visibleProperty.link( alignProbeToBody );

      const probeDragHandler = new DragListener( {
        positionProperty: ammeter.probePositionProperty,
        useParentOffset: true,
        tandem: tandem.createTandem( 'probeDragHandler' ),
        start: () => this.moveToFront()
      } );

      // @public (read-only) {MovableDragHandler} - so events can be forwarded from the toolbox
      this.dragHandler = new DragListener( {
        useParentOffset: true,
        positionProperty: ammeter.bodyPositionProperty,
        tandem: tandem.createTandem( 'dragHandler' ),
        start: () => this.moveToFront(),
        end: function() {
          ammeter.droppedEmitter.emit( bodyNode.globalBounds );

          // After dropping in the play area the probes move independently of the body
          ammeter.draggingProbesWithBodyProperty.set( false );
        },

        // adds support for zoomed coordinate frame, see
        // https://github.com/phetsims/circuit-construction-kit-common/issues/301
        targetNode: this
      } );
      bodyNode.addInputListener( this.dragHandler );
      options.visibleBoundsProperty.link( visibleBounds => {
        const erodedDragBounds = visibleBounds.eroded( CCKCConstants.DRAG_BOUNDS_EROSION );
        this.dragHandler.dragBounds = erodedDragBounds;
        probeDragHandler.dragBounds = erodedDragBounds;
        ammeter.bodyPositionProperty.value = erodedDragBounds.closestPointTo( ammeter.bodyPositionProperty.value );
        ammeter.probePositionProperty.value = erodedDragBounds.closestPointTo( ammeter.probePositionProperty.value );
      } );
      this.probeNode.addInputListener( probeDragHandler );

      /**
       * Detection for ammeter probe + circuit intersection is done in the view since view bounds are used
       */
      const updateAmmeter = () => {

        // Skip work when ammeter is not out, to improve performance.
        if ( ammeter.visibleProperty.get() ) {
          const current = circuitLayerNode.getCurrent( this.probeNode );
          ammeter.currentProperty.set( current );
        }
      };
      circuitLayerNode.circuit.circuitChangedEmitter.addListener( updateAmmeter );
      ammeter.probePositionProperty.link( updateAmmeter );
    }

    // When rendered as an icon, the touch area should span the bounds (no gaps between probes and body)
    if ( options.isIcon ) {
      this.touchArea = this.bounds.copy();
      this.mouseArea = this.bounds.copy();
      this.cursor = 'pointer';
    }
  }

  /**
   * Forward a drag from the toolbox to the play area node.
   * @param {SceneryEvent} event
   * @public
   */
  startDrag( event ) {
    this.dragHandler.press( event );
  }
}

circuitConstructionKitCommon.register( 'AmmeterNode', AmmeterNode );
export default AmmeterNode;