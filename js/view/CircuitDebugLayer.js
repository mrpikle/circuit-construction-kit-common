// Copyright 2021, University of Colorado Boulder

/**
 * For debugging current values and directions.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import ArrowNode from '../../../scenery-phet/js/ArrowNode.js';
import Node from '../../../scenery/js/nodes/Node.js';
import Text from '../../../scenery/js/nodes/Text.js';
import Panel from '../../../sun/js/Panel.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import CurrentSense from '../model/CurrentSense.js';

class CircuitDebugLayer extends Node {
  constructor( circuitLayerNode ) {
    super();
    this.circuitLayerNode = circuitLayerNode;
    this.rebuild();
  }

  // @public
  step() {
    this.rebuild();
  }

  // @private
  rebuild() {
    this.removeAllChildren();
    this.circuitLayerNode.circuit.circuitElements.forEach( circuitElement => {
      const start = circuitElement.startVertexProperty.value.positionProperty.value;
      const end = circuitElement.endVertexProperty.value.positionProperty.value;

      let arrowNode = null;
      let sign = 0;
      if ( circuitElement.currentProperty.value > 0 ) {
        sign = +1;
      }
      if ( circuitElement.currentProperty.value < 0 ) {
        sign = -1;
      }
      if ( sign === +1 ) {
        arrowNode = new ArrowNode( start.x, start.y, end.x, end.y, {
          fill: 'red',
          stroke: 'black',
          lineWidth: 1
        } );
      }
      else if ( sign === -1 ) {
        arrowNode = new ArrowNode( end.x, end.y, start.x, start.y, {
          fill: 'red',
          stroke: 'black',
          lineWidth: 1
        } );
      }
      else {
        arrowNode = new ArrowNode( start.x, start.y, end.x, end.y, {
          fill: 'white',
          stroke: 'black',
          lineWidth: 1
        } );
      }

      this.addChild( arrowNode );

      const offset = end.minus( start ).perpendicular.normalized().timesScalar( 10 );
      const senseNode = new ArrowNode( start.x + offset.x, start.y + offset.y, end.x + offset.x, end.y + offset.y, {
        fill: 'green'
      } );
      this.addChild( senseNode );

      const textNode = new Text( circuitElement.currentProperty.value.toFixed( 2 ) ); //eslint-disable-line
      const panel = new Panel( textNode, {
        center: arrowNode.center,
        fill: circuitElement.currentSenseProperty.value === CurrentSense.FORWARD ? 'red' :
              circuitElement.currentSenseProperty.value === CurrentSense.BACKWARD ? 'rgba(137, 196, 244, 1)' :
              'white'
      } );
      this.addChild( panel );
    } );
  }
}

circuitConstructionKitCommon.register( 'CircuitDebugLayer', CircuitDebugLayer );
export default CircuitDebugLayer;
