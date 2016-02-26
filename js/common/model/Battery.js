// Copyright 2015, University of Colorado Boulder

/**
 *
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var FixedLengthComponent = require( 'CIRCUIT_CONSTRUCTION_KIT_BASICS/common/model/FixedLengthComponent' );

  /**
   *
   * @constructor
   */
  function Battery( position, voltage ) {
    FixedLengthComponent.call( this, 146, position, {
      voltage: voltage
    } );
  }

  return inherit( FixedLengthComponent, Battery );
} );