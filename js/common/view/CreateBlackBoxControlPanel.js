// Copyright 2016, University of Colorado Boulder
// TODO: Review, document, annotate, i18n, bring up to standards

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var circuitConstructionKitCommon = require( 'CIRCUIT_CONSTRUCTION_KIT_COMMON/circuitConstructionKitCommon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Panel = require( 'SUN/Panel' );
  var NumberControl = require( 'SCENERY_PHET/NumberControl' );
  var Property = require( 'AXON/Property' );

  function CreateBlackBoxControlPanel() {
    Panel.call( this, new NumberControl( 'Black Box Width' ), new Property() );
  }

  circuitConstructionKitCommon.register( 'CreateBlackBoxControlPanel', CreateBlackBoxControlPanel );

  return inherit( Panel, CreateBlackBoxControlPanel );
} );