// Copyright 2016-2022, University of Colorado Boulder

/**
 * The interactive scenery node for a vertex in the circuit graph.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Utils from '../../../dot/js/Utils.js';
import Vector2 from '../../../dot/js/Vector2.js';
import merge from '../../../phet-core/js/merge.js';
import { Circle, Color, KeyboardUtils, Node, SceneryEvent, Text, VBox } from '../../../scenery/js/imports.js';
import RoundPushButton from '../../../sun/js/buttons/RoundPushButton.js';
import Tandem from '../../../tandem/js/Tandem.js';
import CCKCConstants from '../CCKCConstants.js';
import CCKCQueryParameters from '../CCKCQueryParameters.js';
import CCKCUtils from '../CCKCUtils.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import Circuit from '../model/Circuit.js';
import Vertex from '../model/Vertex.js';
import CircuitLayerNode from './CircuitLayerNode.js';
import CircuitLayerNodeDragListener from './CircuitLayerNodeDragListener.js';
import DisplayClickToDismissListener from '../../../joist/js/DisplayClickToDismissListener.js';

// constants
const DISTANCE_TO_CUT_BUTTON = 70; // How far in view coordinates the cut button appears from the vertex node
const VERTEX_RADIUS = 16; // for hit testing with probes

// rasterize the images for the red and black dotted lines so they can be rendered with WebGL to improve performance
const CIRCLE_OPTIONS = {
  lineWidth: 1.3,
  lineDash: [ 6, 4 ]
};
const RED_CIRCLE_NODE = new Circle( VERTEX_RADIUS, merge( CIRCLE_OPTIONS, {
  stroke: Color.RED
} ) ).rasterized( { wrap: false } );
const BLACK_CIRCLE_NODE = new Circle( VERTEX_RADIUS, merge( CIRCLE_OPTIONS, {
  stroke: Color.BLACK
} ) ).rasterized( { wrap: false } );

class VertexNode extends Node {
  private readonly circuit: Circuit;
  private readonly cutButton: RoundPushButton;
  private readonly circuitLayerNode: CircuitLayerNode;
  private readonly vertexLabelNode: VBox;
  private readonly updateReadoutTextPosition: ( () => void );
  private readonly vertex: Vertex;
  startOffset: Vector2 | null;
  private readonly highlightNode: Circle;
  private readonly keyListener: { keydown: ( event: any ) => void; };
  private readonly updateStrokeListener: () => void;
  private readonly updateSelectedListener: () => void;
  private readonly updateMoveToFront: () => Node;
  private readonly updatePickableListener: ( pickable: boolean | null ) => Node;
  private readonly clickToDismissListeners: DisplayClickToDismissListener[];
  private readonly dragListener: CircuitLayerNodeDragListener;
  private readonly interruptionListener: ( draggable: boolean ) => void;
  private readonly updateVertexNodePositionListener: () => void;
  static VERTEX_RADIUS: number;
  static webglSpriteNodes: Node[];

  /**
   * @param {CircuitLayerNode} circuitLayerNode - the entire CircuitLayerNode
   * @param {Vertex} vertex - the Vertex that will be displayed
   * @param {Tandem} tandem
   */
  constructor( circuitLayerNode: CircuitLayerNode, vertex: Vertex, tandem: Tandem ) {

    super( {
      tandem: tandem,
      cursor: 'pointer',

      // keyboard navigation
      tagName: 'div', // HTML tag name for representative element in the document, see ParallelDOM.js
      focusable: true,
      focusHighlight: 'invisible', // highlights are drawn by the simulation, invisible is deprecated don't use in future
      phetioDynamicElement: true
    } );

    const circuit = circuitLayerNode.circuit;

    // @private {Circuit}
    this.circuit = circuit;
    const cutButton = circuitLayerNode.cutButton;

    // @private {RoundPushButton}
    this.cutButton = cutButton;

    // @private {CircuitLayerNode}
    this.circuitLayerNode = circuitLayerNode;

    this.addLinkedElement( vertex, {
      tandem: tandem.createTandem( 'vertex' )
    } );

    // Use a query parameter to turn on node voltage readouts for debugging only.
    // @private {Text} display for debugging only

    const customLabelText = new Text( '', {
      fontSize: 22,
      pickable: false
    } );
    const voltageReadout = new Text( '', {
      fontSize: 14,
      pickable: false
    } );
    const children = [
      customLabelText
    ];

    if ( CCKCQueryParameters.vertexDisplay ) {
      children.push( voltageReadout );
    }

    this.vertexLabelNode = new VBox( {
      children: children,
      maxWidth: 50
    } );

    // @private {function} for debugging
    this.updateReadoutTextPosition = () => {
      this.vertexLabelNode.centerX = 0;
      this.vertexLabelNode.bottom = -30;
    };

    if ( CCKCQueryParameters.vertexDisplay ) {
      vertex.voltageProperty.link( voltage => {

        // No need for i18n because this is for debugging only
        const voltageText = `${Utils.toFixed( voltage, 3 )}V`;
        voltageReadout.setText( `${vertex.index} @ ${voltageText}` );
        assert && assert( this.updateReadoutTextPosition );
        if ( this.updateReadoutTextPosition ) {
          this.updateReadoutTextPosition();
        }
      } );
    }

    vertex.labelTextProperty.link( labelText => {
      customLabelText.text = labelText;
      this.updateReadoutTextPosition();
    } );

    // @public (read-only) {Vertex} - the vertex associated with this node
    this.vertex = vertex;

    // @public (read-only) {Vector2|null} - added by CircuitLayerNode during dragging, used for relative drag position,
    // or null if not being dragged.
    this.startOffset = null;

    // @private {Circle} - Highlight is shown when the vertex is selected.
    this.highlightNode = new Circle( 30, {
      stroke: CCKCConstants.HIGHLIGHT_COLOR,
      lineWidth: CCKCConstants.HIGHLIGHT_LINE_WIDTH,
      pickable: false
    } );

    // @private - keyboard listener so that delete or backspace deletes the element - must be disposed
    this.keyListener = {
      keydown: this.keydownListener.bind( this )
    };
    this.addInputListener( this.keyListener );

    // @private {function} Shows up as red when disconnected or black when connected.  When unattachable, the dotted line disappears (black
    // box study)
    this.updateStrokeListener = this.updateStroke.bind( this );

    // Update when any vertex is added or removed, or when the existing circuit values change.
    circuit.vertexGroup.elementCreatedEmitter.addListener( this.updateStrokeListener );
    circuit.vertexGroup.elementDisposedEmitter.addListener( this.updateStrokeListener );
    circuit.circuitChangedEmitter.addListener( this.updateStrokeListener );

    // In Black Box, other wires can be detached from a vertex and this should also update the solder
    circuit.circuitElements.addItemAddedListener( this.updateStrokeListener );
    circuit.circuitElements.addItemRemovedListener( this.updateStrokeListener );

    vertex.attachableProperty.link( this.updateStrokeListener );

    // @private {function}
    this.updateSelectedListener = this.updateSelected.bind( this );
    vertex.isSelectedProperty.link( this.updateSelectedListener );
    vertex.isCuttableProperty.link( this.updateSelectedListener );

    // @private {function}
    this.updateMoveToFront = this.moveToFront.bind( this );
    vertex.relayerEmitter.addListener( this.updateMoveToFront );

    // @private {function}
    this.updatePickableListener = this.setPickable.bind( this );
    vertex.interactiveProperty.link( this.updatePickableListener );

    let initialPoint: Vector2 | null = null;
    let latestPoint: Vector2 | null = null;
    let dragged = false;

    // @private {DisplayClickToDismissListener[]} - called when the user clicks away from the selected vertex
    this.clickToDismissListeners = [];

    // @private {DragListener}
    this.dragListener = new CircuitLayerNodeDragListener( circuitLayerNode, [ () => vertex ], {
      tandem: tandem.createTandem( 'dragListener' ),
      start: ( event: any ) => {
        initialPoint = event.pointer.point;
        latestPoint = event.pointer.point.copy();
        circuitLayerNode.startDragVertex( event.pointer.point, vertex );
        dragged = false;
      },
      drag: ( event: any ) => {
        latestPoint = event.pointer.point.copy();
        dragged = true;
        circuitLayerNode.dragVertex( event.pointer.point, vertex, true );
      },
      end: () => {

        // The vertex can only connect to something if it was actually moved.
        circuitLayerNode.endDrag( vertex, dragged );

        // Only show on a tap, not on every drag.
        if ( vertex.interactiveProperty.get() && latestPoint!.distance( initialPoint! ) < CCKCConstants.TAP_THRESHOLD ) {

          vertex.isSelectedProperty.set( true );

          const dismissListener = ( event: SceneryEvent ) => {
            if ( !_.includes( event.trail.nodes, this ) && !_.includes( event.trail.nodes, cutButton ) ) {
              vertex.isSelectedProperty.set( false );
              this.clearClickListeners();
            }
          };
          const clickToDismissListener = new DisplayClickToDismissListener( dismissListener );
          phet.joist.display.addInputListener( clickToDismissListener );
          this.clickToDismissListeners.push( clickToDismissListener );
        }
        else {

          // Deselect after dragging so a grayed-out cut button doesn't remain when open vertex is connected
          vertex.isSelectedProperty.set( false );
          this.clearClickListeners();
        }
      }
    } );

    // @private {function} When Vertex becomes undraggable, interrupt the input listener
    this.interruptionListener = this.setDraggable.bind( this );
    vertex.isDraggableProperty.lazyLink( this.interruptionListener );

    // Don't permit dragging by the scissors or highlight
    this.addInputListener( this.dragListener );

    // @private {function} - Make sure the cut button remains in the visible screen bounds.
    this.updateVertexNodePositionListener = this.updateVertexNodePosition.bind( this );
    vertex.positionProperty.link( this.updateVertexNodePositionListener );

    // When showing the highlight, make sure it shows in the right place (not updated while invisible)
    vertex.isSelectedProperty.link( this.updateVertexNodePositionListener );
  }

  /**
   * Dispose resources when no longer used.
   * @public
   * @override
   */
  dispose() {
    const vertex = this.vertex;
    const circuit = this.circuit;
    const cutButton = this.circuitLayerNode.cutButton;
    const circuitLayerNode = this.circuitLayerNode;
    vertex.positionProperty.unlink( this.updateVertexNodePositionListener );
    vertex.isSelectedProperty.unlink( this.updateVertexNodePositionListener );
    vertex.isSelectedProperty.unlink( this.updateSelectedListener );
    vertex.interactiveProperty.unlink( this.updatePickableListener );
    vertex.relayerEmitter.removeListener( this.updateMoveToFront );
    CCKCUtils.setInSceneGraph( false, circuitLayerNode.buttonLayer, cutButton );
    CCKCUtils.setInSceneGraph( false, circuitLayerNode.highlightLayer, this.highlightNode );
    circuit.vertexGroup.elementCreatedEmitter.removeListener( this.updateStrokeListener );
    circuit.vertexGroup.elementDisposedEmitter.removeListener( this.updateStrokeListener );

    // In Black Box, other wires can be detached from a vertex and this should also update the solder
    circuit.circuitElements.removeItemAddedListener( this.updateStrokeListener );
    circuit.circuitElements.removeItemRemovedListener( this.updateStrokeListener );

    vertex.attachableProperty.unlink( this.updateStrokeListener );
    circuit.circuitChangedEmitter.removeListener( this.updateStrokeListener );

    this.removeInputListener( this.keyListener );

    // Remove the global listener if it was still enabled
    this.clearClickListeners();

    this.dragListener.dispose();
    this.removeInputListener( this.dragListener );

    vertex.isDraggableProperty.unlink( this.interruptionListener );
    super.dispose();
  }

  /**
   * @param {SceneryEvent} event - scenery keyboard event
   */
  private keydownListener( event: any ) {
    const domEvent = event.domEvent;

    // on delete or backspace, the focused Vertex should be cut
    // @ts-ignore
    if ( KeyboardUtils.isAnyKeyEvent( domEvent, [ KeyboardUtils.KEY_DELETE, KeyboardUtils.KEY_BACKSPACE ] ) ) {

      // prevent default so 'backspace' and 'delete' don't navigate back a page in Firefox, see
      // https://github.com/phetsims/circuit-construction-kit-common/issues/307
      domEvent.preventDefault();

      this.cutButton.enabled && this.circuit.cutVertex( this.circuit.getSelectedVertex()! );
    }
  }

  /**
   * Update whether the vertex is shown as selected.
   */
  private updateSelected() {
    const selected = this.vertex.isSelectedProperty.value;
    const neighborCircuitElements = this.circuit.getNeighborCircuitElements( this.vertex );

    if ( selected ) {

      // Adjacent components should be in front of the vertex, see #20
      for ( let i = 0; i < neighborCircuitElements.length; i++ ) {
        neighborCircuitElements[ i ].vertexSelectedEmitter.emit();
      }
      this.moveToFront();

      // @ts-ignore
      this.focus();
    }
    CCKCUtils.setInSceneGraph( selected, this.circuitLayerNode.highlightLayer, this.highlightNode );
    const numberConnections = neighborCircuitElements.length;
    CCKCUtils.setInSceneGraph( selected && this.vertex.isCuttableProperty.value, this.circuitLayerNode.buttonLayer, this.cutButton );
    selected && this.updateCutButtonPosition();

    // Show a disabled button as a cue that the vertex could be cuttable, but it isn't right now.
    const isConnectedBlackBoxVertex = numberConnections === 1 && !this.vertex.isDraggableProperty.get();
    this.cutButton.enabled = numberConnections > 1 || isConnectedBlackBoxVertex;
  }

  private updateStroke() {

    // A memory leak was being caused by children getting added after dispose was called.
    // This is because the itemRemoved listener in CircuitLayerNode is added (and hence called) before this callback.
    // The CircuitLayerNode listener calls dispose but this listener still gets called back because emitter gets
    // a defensive copy of listeners.
    if ( !this.isDisposed ) {

      const desiredChild = this.circuit.countCircuitElements( this.vertex ) > 1 ? BLACK_CIRCLE_NODE : RED_CIRCLE_NODE;
      if ( this.getChildAt( 0 ) !== desiredChild ) {
        this.children = this.vertexLabelNode ? [ desiredChild, this.vertexLabelNode ] : [ desiredChild ];
      }
      this.visible = this.vertex.attachableProperty.get();
    }
  }

  // update the position of the cut button
  private updateCutButtonPosition() {
    const position = this.vertex.positionProperty.get();

    const neighbors = this.circuit.getNeighborCircuitElements( this.vertex );

    // Compute an unweighted sum of adjacent element directions, and point in the opposite direction so the button
    // will appear in the least populated area.
    const sumOfDirections = new Vector2( 0, 0 );
    for ( let i = 0; i < neighbors.length; i++ ) {
      const v = this.vertex.positionProperty.get().minus(
        neighbors[ i ].getOppositeVertex( this.vertex ).positionProperty.get()
      );
      if ( v.magnitude > 0 ) {
        sumOfDirections.add( v.normalized() );
      }
    }
    if ( sumOfDirections.magnitude < 1E-6 ) {
      sumOfDirections.setXY( 0, -1 ); // Show the scissors above
    }

    const proposedPosition = position.plus( sumOfDirections.normalized().timesScalar( DISTANCE_TO_CUT_BUTTON ) );

    // Property doesn't exist until the node is attached to scene graph
    const bounds = this.circuitLayerNode.visibleBoundsInCircuitCoordinateFrameProperty.get();

    const availableBounds = bounds.eroded( this.cutButton.width / 2 );
    this.cutButton.center = availableBounds.closestPointTo( proposedPosition );
  }

  /**
   * Move the VertexNode when the Vertex moves.
   */
  private updateVertexNodePosition() {
    const position = this.vertex.positionProperty.get();
    this.translation = position;

    // Update the position of the highlight, but only if it is visible
    if ( this.vertex.isSelectedProperty.get() ) {
      this.highlightNode.translation = position;
    }
    this.updateReadoutTextPosition && this.updateReadoutTextPosition();

    // Update the cut button position, but only if the cut button is showing (to save on CPU)
    this.vertex.isSelectedProperty.get() && this.updateCutButtonPosition();
  }

  /**
   * Remove click listeners
   */
  private clearClickListeners() {
    this.clickToDismissListeners.forEach( listener => {
      phet.joist.display.removeInputListener( listener );
      listener.dispose();
    } );
    this.clickToDismissListeners.length = 0;
  }

  /**
   * Sets whether the node is draggable, used as a callback for interrupting the drag listener
   * @param {boolean} draggable
   */
  private setDraggable( draggable: boolean ) {
    if ( !draggable ) {
      this.dragListener.interrupt();
    }
  }
}

// @public {number}
VertexNode.VERTEX_RADIUS = VERTEX_RADIUS;

/**
 * Identifies the images used to render this node so they can be prepopulated in the WebGL sprite sheet.
 * @public {Array.<Image>}
 */
VertexNode.webglSpriteNodes = [
  BLACK_CIRCLE_NODE, RED_CIRCLE_NODE
];
circuitConstructionKitCommon.register( 'VertexNode', VertexNode );
export default VertexNode;
