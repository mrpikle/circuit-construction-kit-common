// Copyright 2016-2021, University of Colorado Boulder
import ModifiedNodalAnalysisCircuitElement from './ModifiedNodalAnalysisCircuitElement.js';

class DynamicCircuitInductor extends ModifiedNodalAnalysisCircuitElement {
  readonly inductance: number;

  /**
   * @param {number} node0
   * @param {number} node1
   * @param {number} inductance
   */
  constructor( node0: number, node1: number, inductance: number ) {
    super( node0, node1, null, 0 );

    // @public
    this.inductance = inductance;
  }
}

export default DynamicCircuitInductor;