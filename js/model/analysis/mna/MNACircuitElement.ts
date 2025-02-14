// Copyright 2017-2022, University of Colorado Boulder

/**
 * Circuit element used for Modified Nodal Analysis.  The same type represents batteries and resistors--what matters
 * is what array they are placed into in the LTACircuit.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import CCKCUtils from '../../../CCKCUtils.js';
import circuitConstructionKitCommon from '../../../circuitConstructionKitCommon.js';

class MNACircuitElement {
  readonly nodeId0: string; // index of the start node
  readonly nodeId1: string; // index of the end node

  constructor( nodeId0: string, nodeId1: string ) {
    assert && CCKCUtils.validateNodeIndex( nodeId0 );
    assert && CCKCUtils.validateNodeIndex( nodeId1 );

    this.nodeId0 = nodeId0;
    this.nodeId1 = nodeId1;
  }

  /**
   * Determine if the element contains the given node id
   * @param {string} nodeId
   * @returns {boolean}
   * @public
   */
  containsNodeId( nodeId: string ) {
    return this.nodeId0 === nodeId || this.nodeId1 === nodeId;
  }

  /**
   * Find the node across from the specified node.
   * @param {string} nodeId
   */
  getOppositeNode( nodeId: string ) {
    assert && assert( this.nodeId0 === nodeId || this.nodeId1 === nodeId );
    return this.nodeId0 === nodeId ? this.nodeId1 : this.nodeId0;
  }
}

circuitConstructionKitCommon.register( 'MNACircuitElement', MNACircuitElement );
export default MNACircuitElement;