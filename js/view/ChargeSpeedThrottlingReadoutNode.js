// Copyright 2016-2017, University of Colorado Boulder

/**
 * This shows a readout that indicates the speed of the simulation is reduced (to prevent a strobe effect).
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var circuitConstructionKitCommon = require( 'CIRCUIT_CONSTRUCTION_KIT_COMMON/circuitConstructionKitCommon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Text = require( 'SCENERY/nodes/Text' );
  var Util = require( 'DOT/Util' );
  var Property = require( 'AXON/Property' );
  var StringUtils = require( 'PHETCOMMON/util/StringUtils' );

  // strings
  var animationSpeedLimitReachedString = require( 'string!CIRCUIT_CONSTRUCTION_KIT_COMMON/animationSpeedLimitReached' );

  /**
   * @param {Property.<number>} timeScaleProperty - the fractional rate of time passage (1.0 = full speed)
   * @param {Property.<boolean>} showCurrentProperty - true if currents are visible
   * @param {Property.<boolean>} isValueDepictionEnabledProperty - true if the explore screen is running
   * @constructor
   */
  function ChargeSpeedThrottlingReadoutNode( timeScaleProperty, showCurrentProperty, isValueDepictionEnabledProperty ) {
    var self = this;
    Text.call( this, animationSpeedLimitReachedString, { fontSize: 26 } );

    Property.multilink( [ timeScaleProperty, showCurrentProperty, isValueDepictionEnabledProperty ],
      function( timeScale, showCurrent, isValueDepictionEnabled ) {
        var percent = timeScale * 100;
        var isThrottled = percent < 99.5;
        var fixed = Util.toFixed( percent, 0 );
        if ( timeScale < 0.01 ) {
          fixed = '< 1';
        }
        self.setText( StringUtils.fillIn( animationSpeedLimitReachedString, { percent: fixed } ) );

        // Only show the throttling message if the speed is less than 100% and charges are visible
        self.visible = isThrottled && showCurrent && isValueDepictionEnabled;
      } );
  }

  circuitConstructionKitCommon.register( 'ChargeSpeedThrottlingReadoutNode', ChargeSpeedThrottlingReadoutNode );

  return inherit( Text, ChargeSpeedThrottlingReadoutNode );
} );