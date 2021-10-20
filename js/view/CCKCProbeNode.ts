// Copyright 2019-2021, University of Colorado Boulder

/**
 * One probe for the WaveMeterNode
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../../axon/js/Property.js';
import Bounds2 from '../../../dot/js/Bounds2.js';
import Node from '../../../scenery/js/nodes/Node.js';
import merge from '../../../phet-core/js/merge.js';
import ProbeNode from '../../../scenery-phet/js/ProbeNode.js';
import DragListener from '../../../scenery/js/listeners/DragListener.js';
import Tandem from '../../../tandem/js/Tandem.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import Vector2Property from '../../../dot/js/Vector2Property.js';
import Vector2 from '../../../dot/js/Vector2.js';

class CCKCProbeNode extends ProbeNode {

  /**
   * @param {Node} node container node which should move to front on press
   * @param {Property.<Bounds2>} visibleBoundsProperty - visible bounds of the ScreenView
   * @param {Object} [options]
   */
  constructor( node: Node, visibleBoundsProperty: Property<Bounds2>, options?: any ) {

    options = merge( {
      cursor: 'pointer',
      sensorTypeFunction: ProbeNode.crosshairs( { stroke: 'white' } ),
      scale: 0.4,
      drag: () => {},
      tandem: Tandem.OPTIONAL
    }, options );

    super( options );

    // Wire position through PhET-iO so it can be recorded in the state
    const positionProperty = new Vector2Property( new Vector2( 0, 0 ), {
      tandem: options.tandem.createTandem( 'positionProperty' )
    } );

    positionProperty.link( ( p: Vector2 ) => this.setTranslation( p ) );

    visibleBoundsProperty.link( ( visibleBounds: Bounds2 ) => this.setCenter( visibleBounds.closestPointTo( this.center ) ) );

    this.addInputListener( new DragListener( {
      positionProperty: positionProperty,
      dragBoundsProperty: visibleBoundsProperty,
      press: () => node.moveToFront(),
      drag: () => options.drag(),
      tandem: options.tandem.createTandem( 'dragListener' )
    } ) );
  }
}

circuitConstructionKitCommon.register( 'CCKCProbeNode', CCKCProbeNode );
export default CCKCProbeNode;