// Copyright 2015-2016, University of Colorado Boulder

/**
 * Model for the Explore Screen.
 * 
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var circuitConstructionKit = require( 'CIRCUIT_CONSTRUCTION_KIT/circuitConstructionKit' );
  var CircuitConstructionKitModel = require( 'CIRCUIT_CONSTRUCTION_KIT/common/model/CircuitConstructionKitModel' );
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @constructor
   */
  function ExploreScreenModel() {
    CircuitConstructionKitModel.call( this, {
      running: false // {boolean} @public changes whether the light bulb brightness and ammeter/voltmeter readouts can be seen
    } );
  }

  circuitConstructionKit.register( 'ExploreScreenModel', ExploreScreenModel );

  return inherit( CircuitConstructionKitModel, ExploreScreenModel );
} );