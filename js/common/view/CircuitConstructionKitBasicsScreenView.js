// Copyright 2015, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var ScreenView = require( 'JOIST/ScreenView' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var CircuitNode = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/view/CircuitNode' );
  var CircuitElementToolbox = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/view/CircuitElementToolbox' );
  var CircuitElementEditContainerPanel = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/view/CircuitElementEditContainerPanel' );
  var SensorToolbox = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/view/SensorToolbox' );
  var VoltmeterNode = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/view/VoltmeterNode' );
  var AmmeterNode = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/view/AmmeterNode' );
  var Emitter = require( 'AXON/Emitter' );
  var CircuitConstructionKitBasicsConstants = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/CircuitConstructionKitBasicsConstants' );

  /**
   * @param {CircuitConstructionKitBasicsModel} circuitConstructionKitBasicsModel
   * @constructor
   */
  function CircuitConstructionKitBasicsScreenView( circuitConstructionKitBasicsModel ) {
    var circuitConstructionKitBasicsScreenView = this;
    this.circuitConstructionKitBasicsModel = circuitConstructionKitBasicsModel;
    this.circuitConstructionKitBasicsScreenViewLayoutCompletedEmitter = new Emitter();
    ScreenView.call( this );

    var voltmeterNode = new VoltmeterNode( circuitConstructionKitBasicsModel.voltmeter );
    circuitConstructionKitBasicsModel.voltmeter.droppedEmitter.addListener( function( bodyNodeGlobalBounds ) {
      if ( bodyNodeGlobalBounds.intersectsBounds( circuitConstructionKitBasicsScreenView.sensorToolbox.globalBounds ) ) {
        circuitConstructionKitBasicsModel.voltmeter.visible = false;
      }
    } );
    circuitConstructionKitBasicsModel.voltmeter.visibleProperty.link( function( visible ) {
      voltmeterNode.visible = visible;
    } );

    var ammeterNode = new AmmeterNode( circuitConstructionKitBasicsModel.ammeter );
    circuitConstructionKitBasicsModel.ammeter.droppedEmitter.addListener( function( bodyNodeGlobalBounds ) {
      if ( bodyNodeGlobalBounds.intersectsBounds( circuitConstructionKitBasicsScreenView.sensorToolbox.globalBounds ) ) {
        circuitConstructionKitBasicsModel.ammeter.visible = false;
      }
    } );
    circuitConstructionKitBasicsModel.ammeter.visibleProperty.link( function( visible ) {
      ammeterNode.visible = visible;
    } );

    // Pass the view into circuit node so that circuit elements can be dropped back into the toolbox
    this.circuitNode = new CircuitNode( circuitConstructionKitBasicsModel.circuit, this );
    this.circuitElementToolbox = new CircuitElementToolbox( circuitConstructionKitBasicsModel, this );

    // @protected - so that subclasses can add a layout circuit element near it
    this.sensorToolbox = new SensorToolbox( voltmeterNode, ammeterNode );

    this.addChild( this.circuitNode );
    this.addChild( this.sensorToolbox );

    // Reset All button
    var resetAllButton = new ResetAllButton( {
      listener: function() {
        circuitConstructionKitBasicsModel.reset();
      }
    } );
    this.addChild( resetAllButton );

    // Has to be interleaved in the circuit layering to support the black box, so that the toolbox can be behind
    // circuit elements but in front of the transparency overlay
    this.circuitNode.mainLayer.addChild( this.circuitElementToolbox );
    var circuitElementEditContainerPanel = new CircuitElementEditContainerPanel( circuitConstructionKitBasicsModel.circuit, this.visibleBoundsProperty );
    this.visibleBoundsProperty.lazyLink( function( visibleBounds ) {
      var dx = -visibleBounds.x;
      var dy = -visibleBounds.y;
      var width = visibleBounds.width;
      var height = visibleBounds.height;

      // Float the resetAllButton to the bottom right
      var inset = CircuitConstructionKitBasicsConstants.layoutInset;
      resetAllButton.mutate( {
        right: visibleBounds.right - inset,
        bottom: visibleBounds.bottom - inset
      } );

      circuitConstructionKitBasicsScreenView.circuitElementToolbox.mutate( {
        left: visibleBounds.left + inset,
        top: visibleBounds.top + inset
      } );

      circuitConstructionKitBasicsScreenView.sensorToolbox.mutate( {
        right: visibleBounds.right - inset,
        top: visibleBounds.top + inset
      } );

      circuitElementEditContainerPanel.mutate( {
        centerX: visibleBounds.centerX,
        bottom: visibleBounds.bottom - inset
      } );

      // TODO: Can this be handled by adding a listener to the ScreenView.visibleBoundsProperty?
      circuitConstructionKitBasicsScreenView.circuitConstructionKitBasicsScreenViewLayoutCompletedEmitter.emit1( {
        dx: dx,
        dy: dy,
        width: width,
        height: height
      } );
    } );

    this.addChild( circuitElementEditContainerPanel );

    this.addChild( voltmeterNode );
    this.addChild( ammeterNode );

    // Detection for voltmeter probe + circuit collision is done in the view since view bounds are used
    var updateVoltmeter = function() {
      var redConnection = circuitConstructionKitBasicsScreenView.getVoltageConnection( voltmeterNode.redProbeNode, voltmeterNode.voltmeter.redProbePosition );
      var blackConnection = circuitConstructionKitBasicsScreenView.getVoltageConnection( voltmeterNode.blackProbeNode, voltmeterNode.voltmeter.blackProbePosition );
      if ( redConnection === null || blackConnection === null ) {
        circuitConstructionKitBasicsModel.voltmeter.voltage = null;
      }
      else if ( !circuitConstructionKitBasicsModel.circuit.areVerticesConnected( redConnection.vertex, blackConnection.vertex ) ) {

        // Voltmeter probes each hit things but they were not connected to each other through the circuit.
        circuitConstructionKitBasicsModel.voltmeter.voltage = null;
      }
      else if ( redConnection !== null && redConnection.vertex.insideTrueBlackBox ) {

        // Cannot read values inside the black box
        circuitConstructionKitBasicsModel.voltmeter.voltage = null;
      }
      else if ( blackConnection !== null && blackConnection.vertex.insideTrueBlackBox ) {

        // Cannot read values inside the black box
        circuitConstructionKitBasicsModel.voltmeter.voltage = null;
      }
      else {
        circuitConstructionKitBasicsModel.voltmeter.voltage = redConnection.voltage - blackConnection.voltage;
      }
    };
    circuitConstructionKitBasicsModel.circuit.circuitChangedEmitter.addListener( updateVoltmeter );
    circuitConstructionKitBasicsModel.voltmeter.redProbePositionProperty.link( updateVoltmeter );
    circuitConstructionKitBasicsModel.voltmeter.blackProbePositionProperty.link( updateVoltmeter );

    // Detection for ammeter probe + circuit collision is done in the view since view bounds are used
    var updateAmmeter = function() {
      var current = circuitConstructionKitBasicsScreenView.getCurrent( ammeterNode.probeNode );
      circuitConstructionKitBasicsModel.ammeter.current = current;
    };
    circuitConstructionKitBasicsModel.circuit.circuitChangedEmitter.addListener( updateAmmeter );
    circuitConstructionKitBasicsModel.ammeter.probePositionProperty.link( updateAmmeter );
  }

  return inherit( ScreenView, CircuitConstructionKitBasicsScreenView, {

    // TODO: Highlight the toolbox when something can drop over it.
    canNodeDropInToolbox: function( circuitElementNode ) {
      var isSingle = this.circuitConstructionKitBasicsModel.circuit.isSingle( circuitElementNode.circuitElement );
      var inBounds = this.circuitElementToolbox.globalBounds.containsPoint( circuitElementNode.globalBounds.center );
      return isSingle && inBounds;
    },

    dropCircuitElementNodeInToolbox: function( circuitElementNode ) {

      // Only drop in the box if it was a single component, if connected to other things, do not
      this.circuitConstructionKitBasicsModel.circuit.remove( circuitElementNode.circuitElement );
    },

    /**
     * Find where the voltmeter probe node intersects the wire, for computing the voltage difference
     * @param {Node} probeNode
     * @private
     */
    getCurrent: function( probeNode ) {

      var hitWireNode = this.hitWireNode( probeNode );
      if ( hitWireNode ) {
        return hitWireNode.wire.current;
      }
      else {
        return null;
      }
    },

    /**
     * Check for an intersection between a probeNode and a wire, return null if no hits.
     * @param probeNode
     * @returns {*}
     */
    hitWireNode: function( probeNode ) {
      for ( var i = 0; i < this.circuitNode.wireNodes.length; i++ ) {
        var wireNode = this.circuitNode.wireNodes[ i ];

        // Don't connect to wires in the black box
        // TODO: is this too expensive on iPad?
        if ( !wireNode.wire.insideTrueBlackBox && wireNode.getStrokedShape().containsPoint( probeNode.translation ) ) {
          return wireNode;
        }
      }
      return null;
    },

    /**
     * Find where the voltmeter probe node intersects the wire, for computing the voltage difference
     * @param {Image} probeNode - the probe node from the VoltmeterNode
     * @param {Vector2} probePosition
     * @private
     * @return {Object} with vertex (for checking connectivity) and voltage (if connected)
     */
    getVoltageConnection: function( probeNode, probePosition ) {

      // Check for intersection with a vertex
      for ( var i = 0; i < this.circuitNode.vertexNodes.length; i++ ) {
        var vertexNode = this.circuitNode.vertexNodes[ i ];
        var position = vertexNode.vertex.position;
        var radius = vertexNode.dottedLineNodeRadius;

        var distance = probePosition.distance( position );
        if ( distance <= radius ) {
          return {
            vertex: vertexNode.vertex,
            voltage: vertexNode.vertex.voltage
          };
        }
      }

      // Check for intersection with a wire
      var wireNode = this.hitWireNode( probeNode );
      if ( wireNode ) {

        // TODO: potentiometer: weight according to distance to the node
        return {
          vertex: wireNode.wire.startVertex,
          voltage: (wireNode.wire.startVertex.voltage + wireNode.wire.endVertex.voltage) / 2
        };
      }
      else {
        return null;
      }
    }
  } );
} );