// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var circuitConstructionKitBasics = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/circuitConstructionKitBasics' );
  var CircuitConstructionKitBasicsPanel = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/view/CircuitConstructionKitBasicsPanel' );
  var VBox = require( 'SCENERY/nodes/VBox' );
  var Battery = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/model/Battery' );
  var LightBulb = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/model/LightBulb' );
  var Wire = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/model/Wire' );
  var Resistor = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/model/Resistor' );
  var Line = require( 'SCENERY/nodes/Line' );
  var Image = require( 'SCENERY/nodes/Image' );
  var CircuitConstructionKitBasicsConstants = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/CircuitConstructionKitBasicsConstants' );
  var ResistorNode = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/view/ResistorNode' );
  var Vector2 = require( 'DOT/Vector2' );

  // images
  var batteryImage = require( 'mipmap!CIRCUIT_CONSTRUCTION_KIT_BASICS/battery.png' );
  var lightBulbImage = require( 'mipmap!CIRCUIT_CONSTRUCTION_KIT_BASICS/light-bulb.png' );

  /**
   * @param {CircuitConstructionKitBasicsModel} circuitConstructionKitBasicsModel
   * @param {CircuitConstructionKitBasicsScreenView} circuitConstructionKitBasicsScreenView - I considered passing a function here, but recalled arguments by
   *                                                      - @jonathanolson and others about easier navigability of passing the object
   *                                                      - and invoking a method on it (despite this breaking encapsulation)
   * @constructor
   */
  function CircuitComponentToolbox( circuitConstructionKitBasicsModel, circuitConstructionKitBasicsScreenView ) {

    var circuitComponentToolbox = this;
    // From: https://github.com/phetsims/scenery-phet/issues/195#issuecomment-186300071
    // @jonathanolson and I looked into the way Charges and Fields just calls startDrag(event) on the play area drag listener (which adds a listener to the pointer, in the usual SimpleDragHandler way), and it seems like a good pattern. I will try this pattern for Circuit Construction Kit, when I am working on the toolbox listeners.

    /**
     *
     * @param {Function} createComponent - given a view location, create a circuit component
     * @param {ObservableArray.<Object>} modelList - list of circuit components the new component should be added to
     * @param {Array.<Node>} viewList - list of nodes where the newly created circuit component node will be found
     * @param {Function} getCircuitComponentFromNode - function that gets a model element from a node
     * @returns {{down: down}}
     */
    var createToolIconInputListener = function( createComponent, modelList, viewList, getCircuitComponentFromNode ) {
      return {
        down: function( event ) {

          // Ignore non-left-mouse-button
          // TODO: why? see https://github.com/phetsims/charges-and-fields/issues/76
          if ( event.pointer.isMouse && event.domEvent.button !== 0 ) {
            return;
          }

          // initial position of the pointer in the screenView coordinates
          var viewPosition = circuitComponentToolbox.globalToParentPoint( event.pointer.point );
          var component = createComponent( viewPosition );
          modelList.add( component );
          var matchedNodes = viewList.filter( function( componentNode ) {
            return getCircuitComponentFromNode( componentNode ) === component;
          } );
          assert && assert( matchedNodes.length === 1, 'should have found the one and only node for this battery' );
          var componentNode = matchedNodes[ 0 ];
          componentNode.inputListener.startDrag( event );
        }
      };
    };

    // Convenience vars.  TODO: Just pass these in as main constructor if no other parts of circuitConstructionKitBasicsModel or circuitConstructionKitBasicsScreenView are needed?
    var circuit = circuitConstructionKitBasicsModel.circuit;
    var circuitNode = circuitConstructionKitBasicsScreenView.circuitNode;

    var iconWidth = CircuitConstructionKitBasicsConstants.toolboxIconLength;
    var wireNode = new Line( 0, 0, iconWidth, 0, {
      stroke: CircuitConstructionKitBasicsConstants.wireColor,
      lineWidth: 10,
      cursor: 'pointer',
      strokePickable: true,
      scale: 1
    } );

    var resistorNode = new ResistorNode( circuitConstructionKitBasicsScreenView.circuitNode, new Resistor( new Vector2( 0, 0 ), CircuitConstructionKitBasicsConstants.DEFAULT_RESISTANCE ), { icon: true } );

    CircuitConstructionKitBasicsPanel.call( this, new VBox( {
      spacing: CircuitConstructionKitBasicsConstants.toolboxItemSpacing,
      children: [
        wireNode.mutate( { scale: iconWidth / Math.max( wireNode.width, wireNode.height ) } )
          .addInputListener( createToolIconInputListener(
            function( position ) { return new Wire( position ); },
            circuit.wires,
            circuitNode.wireNodes,
            function( wireNode ) { return wireNode.wire; }
          ) ),
        new Image( batteryImage, {
          cursor: 'pointer',
          scale: iconWidth / Math.max( batteryImage[ 0 ].width, batteryImage[ 0 ].height )
        } )
          .addInputListener( createToolIconInputListener(
            function( position ) { return new Battery( position, 9 ); },
            circuit.batteries,
            circuitNode.batteryNodes,
            function( batteryNode ) { return batteryNode.battery; }
          ) ),
        new Image( lightBulbImage, {
          cursor: 'pointer',
          scale: iconWidth / Math.max( lightBulbImage[ 0 ].width, lightBulbImage[ 0 ].height ) // constrained by being too tall, not too wide
        } )
          .addInputListener( createToolIconInputListener(
            function( position ) { return new LightBulb( position, CircuitConstructionKitBasicsConstants.DEFAULT_RESISTANCE ); },
            circuit.lightBulbs,
            circuitNode.lightBulbNodes,
            function( lightBulbNode ) { return lightBulbNode.lightBulb; }
          ) ),

        resistorNode.mutate( {
            pickable: true,
            cursor: 'pointer',
            scale: iconWidth / Math.max( resistorNode.width, resistorNode.height )
          } )
          .addInputListener( createToolIconInputListener(
            function( position ) { return new Resistor( position, CircuitConstructionKitBasicsConstants.DEFAULT_RESISTANCE ); },
            circuit.resistors,
            circuitNode.resistorNodes,
            function( resistorNode ) { return resistorNode.resistor; }
          ) )
      ]
    } ) );
  }

  circuitConstructionKitBasics.register( 'CircuitComponentToolbox', CircuitComponentToolbox );
  return inherit( CircuitConstructionKitBasicsPanel, CircuitComponentToolbox, {} );
} );