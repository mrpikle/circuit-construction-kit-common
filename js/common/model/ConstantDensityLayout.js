// Copyright 2016, University of Colorado Boulder

/**
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Electron = require( 'CIRCUIT_CONSTRUCTION_KIT/common/model/Electron' );
  var BranchSet = require( 'CIRCUIT_CONSTRUCTION_KIT/common/model/BranchSet' );

  // constants
  var dolayout = true;
  var electronsVisible = true;
  var ELECTRON_DX = 0.56 / 2; // TODO: Factor out

  function ConstantDensityLayout( circuit, particleSet ) {
    this.circuit = circuit;
    this.particleSet = particleSet;
  }

  return inherit( Object, ConstantDensityLayout, {
    branchesMoved: function( branches ) {
      if ( !dolayout ) {
        return;
      }
      var bs = new BranchSet( this.circuit, branches );
      for ( var i = 0; i < branches.length; i++ ) {
        bs.addBranches( this.circuit.getStrongConnections( branches[ i ].getStartJunction() ) );
        bs.addBranches( this.circuit.getStrongConnections( branches[ i ].getEndJunction() ) );
      }
      var torelayout = bs.getBranches();
      this.layoutElectrons( torelayout );
    },
    layoutElectronsForBranches: function( branches ) {
      for ( var i = 0; i < branches.length; i++ ) {
        var branch = branches[ i ];
        this.layoutElectrons( branch );
      }
    },
    layoutElectrons: function( branch ) {
      this.particleSet.removeParticles( branch );

      if ( electronsVisible ) {
        var offset = ELECTRON_DX / 2;
        var endingPoint = branch.getLength() - offset;
        //compress or expand, but fix a particle at startingPoint and endingPoint.
        var L = endingPoint - offset;
        var desiredDensity = 1 / ELECTRON_DX;
        var N = L * desiredDensity;
        var integralNumberParticles = Math.ceil( N );
        var mydensity = ( integralNumberParticles - 1 ) / L;
        var dx = 1 / mydensity;
        if ( mydensity === 0 ) {
          integralNumberParticles = 0;
        }
        for ( var i = 0; i < integralNumberParticles; i++ ) {
          this.particleSet.addParticle( new Electron( branch, i * dx + offset ) );
        }
      }

    }
  } );
} );