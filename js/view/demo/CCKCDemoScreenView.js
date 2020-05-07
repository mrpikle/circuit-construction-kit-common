// Copyright 2020, University of Colorado Boulder

import ScreenView from '../../../../joist/js/ScreenView.js';
import Shape from '../../../../kite/js/Shape.js';
import Path from '../../../../scenery/js/nodes/Path.js';

// Constants for the resistor
const SCHEMATIC_SCALE = 0.54;
const SCHEMATIC_PERIOD = 22 * SCHEMATIC_SCALE;
const SCHEMATIC_STEM_WIDTH = 84 * SCHEMATIC_SCALE;
const SCHEMATIC_WAVELENGTH = 54 * SCHEMATIC_SCALE;

// Constants for the light bulb
// The height from the vertex to the center of the light bulb schematic circle
const LEAD_Y = -73;

class CCKCDemoScreenView extends ScreenView {
  constructor( options ) {
    super( options );

    // Classical zig-zag shape
    const schematicShape = new Shape()
      .moveTo( 0, 50 * SCHEMATIC_SCALE )
      .lineToRelative( SCHEMATIC_STEM_WIDTH, 0 )
      .lineToRelative( SCHEMATIC_PERIOD / 2, -SCHEMATIC_WAVELENGTH / 2 )
      .lineToRelative( SCHEMATIC_PERIOD, SCHEMATIC_WAVELENGTH )
      .lineToRelative( SCHEMATIC_PERIOD, -SCHEMATIC_WAVELENGTH )
      .lineToRelative( SCHEMATIC_PERIOD, SCHEMATIC_WAVELENGTH )
      .lineToRelative( SCHEMATIC_PERIOD, -SCHEMATIC_WAVELENGTH )
      .lineToRelative( SCHEMATIC_PERIOD, SCHEMATIC_WAVELENGTH )
      .lineToRelative( SCHEMATIC_PERIOD / 2, -SCHEMATIC_WAVELENGTH / 2 )
      .lineToRelative( SCHEMATIC_STEM_WIDTH, 0 );

    const resistorPath = new Path( schematicShape, {
      lineWidth: 3,
      stroke: 'black',
      center: this.layoutBounds.center
    } );
    this.addChild( resistorPath );

    // light bulb with a filament inside

    const rightLeadX = 25;
    const schematicCircleRadius = 12;

    // The "blip" in the filament that looks like an upside down "u" semicircle

    const INNER_RADIUS = 5;

    const originalBulbShape = new Shape()

      // Left lead
      .moveTo( 0, 0 )
      .lineTo( 0, LEAD_Y )

      // Right lead
      .moveTo( rightLeadX, LEAD_Y )
      .lineTo( rightLeadX, 0 )

      // Outer circle
      .moveTo( 0, LEAD_Y )
      .arc( rightLeadX / 2, LEAD_Y, schematicCircleRadius, Math.PI, -Math.PI, true )

      // Filament
      .moveTo( 0, LEAD_Y )
      .arc( schematicCircleRadius, LEAD_Y, INNER_RADIUS, Math.PI, 0, false )
      .lineTo( rightLeadX, LEAD_Y );

    const lightBulbPath = new Path( originalBulbShape, {
      lineWidth: 4,
      stroke: 'black',
      top: resistorPath.bottom + 20,
      centerX: resistorPath.centerX
    } );
    this.addChild( lightBulbPath );


    //////////
    /// FUSE
    ///////////

    // Schematic view is a line with a box around it, looks the same whether tripped or untripped.
    const boxHeight = 30;
    const chargePathLength = 150;
    const fuseShape = new Shape()
      .moveTo( 0, 0 )
      .lineToRelative( chargePathLength, 0 )
      .moveTo( 0, 0 )
      .rect( SCHEMATIC_STEM_WIDTH, -boxHeight / 2, chargePathLength - SCHEMATIC_STEM_WIDTH * 2, boxHeight );

    this.addChild( new Path( fuseShape, {
      lineWidth: 4,
      stroke: 'black',
      bottom: resistorPath.top - 20,
      centerX: resistorPath.centerX
    } ) );

    // IEC Resistor

    const halfBoxHeight = boxHeight / 2;
    const boxLength = 70;
    const resistorIEC = new Shape()
        .moveTo( 0, 50 * SCHEMATIC_SCALE )
        .lineToRelative( SCHEMATIC_STEM_WIDTH, 0 )
        .lineToRelative(0, -halfBoxHeight )
        .lineToRelative( boxLength, 0)
        .lineToRelative(0, halfBoxHeight)
        .lineToRelative( SCHEMATIC_STEM_WIDTH, 0 )
        .lineToRelative( -SCHEMATIC_STEM_WIDTH, 0 )
        .lineToRelative(0, halfBoxHeight )
        .lineToRelative( -boxLength, 0 )
        .lineToRelative(0, -halfBoxHeight );

    const resistorPathIEC = new Path( resistorIEC, {
      lineWidth: 3,
      stroke: 'black',
      bottom: resistorPath.bottom + 160,
      centerX: resistorPath.centerX
    } );
    this.addChild( resistorPathIEC );

    ///// IEC fuse

    const boxLength7th = boxLength / 7;
    const fuseIEC = new Shape()
        .moveTo( 0, 50 * SCHEMATIC_SCALE )
        .lineToRelative( SCHEMATIC_STEM_WIDTH, 0 )
        .lineToRelative(0, -halfBoxHeight )
        .lineToRelative( boxLength, 0)
        .lineToRelative(0, halfBoxHeight)
        .lineToRelative( SCHEMATIC_STEM_WIDTH, 0 )
        .lineToRelative( -SCHEMATIC_STEM_WIDTH, 0 )
        .lineToRelative(0, halfBoxHeight)
        .lineToRelative( -boxLength, 0 )
        .lineToRelative(0, -boxHeight )
        .lineToRelative( boxLength7th, 0 )
        .lineToRelative(0, boxHeight )
        .lineToRelative(boxLength - 2 * boxLength7th, 0 )
        .lineToRelative(0, -boxHeight );

    const fusePathIEC = new Path( fuseIEC, {
      lineWidth: 3,
      stroke: 'black',
      bottom: resistorPath.bottom + 200,
      centerX: resistorPath.centerX
    } );
    this.addChild( fusePathIEC );

    ///// IEC Bulb

    const schematicCircleDiameter = 2 * schematicCircleRadius;
    const cosPi4 = Math.cos(Math.PI / 4);
    const sinPi4 = Math.sin( Math.PI / 4);
    const bulbIEC = new Shape()
        .moveTo( 0, LEAD_Y )
        .arc( rightLeadX / 2, LEAD_Y, schematicCircleRadius, Math.PI, -Math.PI, true )
        .horizontalLineToRelative(-SCHEMATIC_STEM_WIDTH)
        .moveTo(schematicCircleDiameter, LEAD_Y)
        .horizontalLineToRelative(SCHEMATIC_STEM_WIDTH)

        // addition of 0.5 seems to visually work better!
        .moveTo(schematicCircleRadius + 0.5, LEAD_Y)

        .lineToRelative(schematicCircleRadius * cosPi4, -schematicCircleRadius * sinPi4)
        .lineToRelative(-schematicCircleDiameter * cosPi4, schematicCircleDiameter * sinPi4)
        .moveTo(schematicCircleRadius, LEAD_Y)
        .lineToRelative(-schematicCircleRadius * cosPi4, -schematicCircleRadius * sinPi4)
        .lineToRelative(schematicCircleDiameter * cosPi4, schematicCircleDiameter * sinPi4);

    const bulbPathIEC = new Path( bulbIEC, {
      lineWidth: 3,
      stroke: 'black',
      bottom: resistorPath.bottom + 240,
      centerX: resistorPath.centerX
    } );
    this.addChild( bulbPathIEC );

  }
}

export default CCKCDemoScreenView;