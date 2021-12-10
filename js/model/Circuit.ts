// Copyright 2015-2021, University of Colorado Boulder

/**
 * A collection of circuit elements in the play area, not necessarily connected.  (For instance it could be 2 disjoint
 * circuits). This exists for the life of the sim and hence does not need a dispose implementation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../axon/js/BooleanProperty.js';
import Emitter from '../../../axon/js/Emitter.js';
import NumberProperty from '../../../axon/js/NumberProperty.js';
import createObservableArray from '../../../axon/js/createObservableArray.js';
import Property from '../../../axon/js/Property.js';
import dotRandom from '../../../dot/js/dotRandom.js';
import Vector2 from '../../../dot/js/Vector2.js';
import merge from '../../../phet-core/js/merge.js';
import PhetioGroup from '../../../tandem/js/PhetioGroup.js';
import NullableIO from '../../../tandem/js/types/NullableIO.js';
import ReferenceIO from '../../../tandem/js/types/ReferenceIO.js';
import CCKCConstants from '../CCKCConstants.js';
import CCKCQueryParameters from '../CCKCQueryParameters.js';
import circuitConstructionKitCommon from '../circuitConstructionKitCommon.js';
import ACVoltage from './ACVoltage.js';
import Battery from './Battery.js';
import Capacitor from './Capacitor.js';
import Charge from './Charge.js';
import ChargeAnimator from './ChargeAnimator.js';
import CircuitElement from './CircuitElement.js';
import CurrentType from './CurrentType.js';
import Dog from './Dog.js';
import DynamicCircuitElement from './DynamicCircuitElement.js';
import FixedCircuitElement from './FixedCircuitElement.js';
import Fuse from './Fuse.js';
import Inductor from './Inductor.js';
import LightBulb from './LightBulb.js';
import LinearTransientAnalysis from './analysis/LinearTransientAnalysis.js';
import Resistor from './Resistor.js';
import SeriesAmmeter from './SeriesAmmeter.js';
import Switch from './Switch.js';
import Vertex from './Vertex.js';
import Wire from './Wire.js';
import CircuitElementViewType from './CircuitElementViewType.js';
import Tandem from '../../../tandem/js/Tandem.js';
import Bounds2 from '../../../dot/js/Bounds2.js';
import VoltageConnection from './VoltageConnection.js';
import StringIO from '../../../tandem/js/types/StringIO.js';

// constants
const SNAP_RADIUS = 30; // For two vertices to join together, they must be this close, in view coordinates
const BUMP_AWAY_RADIUS = 20; // If two vertices are too close together after one is released, and they could not be
// joined then bump them apart so they do not look connected.

const BATTERY_LENGTH = CCKCConstants.BATTERY_LENGTH;
const WIRE_LENGTH = CCKCConstants.WIRE_LENGTH;

// Determine what sense a circuit element should have to create an overall positive readout, given the specified current
const getSenseForPositive = ( current: number ) => current < 0 ? 'backward' :
                                                   current > 0 ? 'forward' :
                                                   'unspecified';

// Determine what sense a circuit element should have to create an overall negative readout, given the specified current
const getSenseForNegative = ( current: number ) => current < 0 ? 'forward' :
                                                   current > 0 ? 'backward' :
                                                   'unspecified';

const trueFunction = _.constant( true ); // Lower cased so IDEA doesn't think it is a constructor

type CircuitOptions = {
  blackBoxStudy: boolean
};

type Pair = { v1: Vertex, v2: Vertex };

class Circuit {
  private readonly viewTypeProperty: Property<CircuitElementViewType>;
  readonly addRealBulbsProperty: Property<boolean>;
  private readonly blackBoxStudy: boolean;
  readonly wireResistivityProperty: NumberProperty;
  readonly sourceResistanceProperty: NumberProperty;
  readonly circuitElements: ObservableArray<CircuitElement>;
  readonly charges: ObservableArray<Charge>;
  readonly showCurrentProperty: BooleanProperty;
  readonly currentTypeProperty: Property<CurrentType>;
  readonly timeProperty: NumberProperty;
  readonly chargeAnimator: ChargeAnimator;
  readonly circuitChangedEmitter: Emitter<[]>;
  readonly vertexDroppedEmitter: Emitter<[ Vertex ]>;
  readonly componentEditedEmitter: Emitter<[]>;
  readonly vertexGroup: PhetioGroup<Vertex>;
  readonly selectedCircuitElementProperty: Property<CircuitElement | null>;
  dirty: boolean;
  private readonly stepActions: ( () => void )[];
  readonly wireGroup: PhetioGroup<Wire>;
  readonly batteryGroup: PhetioGroup<Battery>;
  readonly highVoltageBatteryGroup: PhetioGroup<Battery>;
  readonly acVoltageGroup: PhetioGroup<ACVoltage>;
  readonly resistorGroup: PhetioGroup<Resistor>;
  readonly fuseGroup: PhetioGroup<Fuse>;
  readonly seriesAmmeterGroup: PhetioGroup<SeriesAmmeter>;
  readonly highResistanceLightBulbGroup: PhetioGroup<LightBulb>
  readonly capacitorGroup: PhetioGroup<Capacitor>;
  readonly inductorGroup: PhetioGroup<Inductor>;
  readonly switchGroup: PhetioGroup<Switch>
  readonly lightBulbGroup: PhetioGroup<LightBulb>;
  private readonly realLightBulbGroup: PhetioGroup<LightBulb>;
  private readonly groups: PhetioGroup<CircuitElement>[];

  /**
   * @param {Property.<CircuitElementViewType>} viewTypeProperty
   * @param {Property.<boolean>} addRealBulbsProperty
   * @param {Tandem} tandem
   * @param {Object} [providedOptions]
   */
  constructor( viewTypeProperty: Property<CircuitElementViewType>, addRealBulbsProperty: Property<boolean>, tandem: Tandem,
               providedOptions?: Partial<CircuitOptions> ) {

    // @public
    this.viewTypeProperty = viewTypeProperty;
    this.addRealBulbsProperty = addRealBulbsProperty;

    const options = merge( { blackBoxStudy: false }, providedOptions ) as CircuitOptions;

    // @public {Object}
    this.blackBoxStudy = options.blackBoxStudy;

    // @public {NumberProperty} - All wires share the same resistivity, which is defined by
    // resistance = resistivity * length. On the Lab Screen, there is a wire resistivity control
    this.wireResistivityProperty = new NumberProperty( CCKCConstants.DEFAULT_RESISTIVITY, {
      tandem: tandem.createTandem( 'wireResistivityProperty' )
    } );

    // @public {NumberProperty} - All batteries share a single internal resistance value, which can be edited with
    // a control on the Lab Screen
    this.sourceResistanceProperty = new NumberProperty( CCKCConstants.DEFAULT_BATTERY_RESISTANCE, {
      tandem: tandem.createTandem( 'sourceResistanceProperty' )
    } );

    // @public {ObservableArrayDef.<CircuitElement>} - The different types of CircuitElement the circuit may
    // contain, including Wire, Battery, Switch, Resistor, LightBulb, etc.
    this.circuitElements = createObservableArray( {
      phetioState: true,
      phetioType: createObservableArray.ObservableArrayIO( ReferenceIO( CircuitElement.CircuitElementIO ) ),
      tandem: tandem.createTandem( 'circuitElements' )
    } );

    // @public {ObservableArrayDef.<Charge>} - the charges in the circuit
    this.charges = createObservableArray();

    // @public {Property.<CurrentType>} - whether to show charges or conventional current
    this.currentTypeProperty = new Property( CCKCQueryParameters.currentType, {
      tandem: tandem.createTandem( 'currentTypeProperty' ),
      phetioType: Property.PropertyIO( StringIO )
    } );

    // When the current type changes, mark everything as dirty and relayout charges
    this.currentTypeProperty.lazyLink( () => this.relayoutAllCharges() );

    // @public {BooleanProperty} - whether the current should be displayed
    this.showCurrentProperty = new BooleanProperty( CCKCQueryParameters.showCurrent, {
      tandem: tandem.createTandem( 'showCurrentProperty' )
    } );

    // @public (read-only) elapsed time for the circuit model
    this.timeProperty = new NumberProperty( 0 );

    // @public {ChargeAnimator} - move the charges with speed proportional to current
    this.chargeAnimator = new ChargeAnimator( this );

    // Mark as dirty when voltages or resistances change.
    const markDirtyListener = this.markDirty.bind( this );

    // Solve the circuit when any of the circuit element attributes change.
    this.circuitElements.addItemAddedListener( circuitElement => {
      circuitElement.getCircuitProperties().forEach( property => property.lazyLink( markDirtyListener ) );
      if ( circuitElement instanceof DynamicCircuitElement ) {
        circuitElement.clearEmitter.addListener( markDirtyListener );
        circuitElement.disposeEmitterCircuitElement.addListener( () => {
          circuitElement.clearEmitter.removeListener( markDirtyListener );
        } );
      }

      // When any vertex moves, relayout all charges within the fixed-length connected component, see #100
      circuitElement.chargeLayoutDirty = true;

      const updateCharges = () => this.markAllConnectedCircuitElementsDirty( circuitElement.startVertexProperty.get() );

      // For circuit elements that can change their length, make sure to update charges when the length changes.
      if ( circuitElement.lengthProperty ) {
        circuitElement.lengthProperty.link( updateCharges );
        circuitElement.disposeEmitterCircuitElement.addListener( () => circuitElement.lengthProperty!.unlink( updateCharges ) );
      }
      this.markDirty();
      circuitElement.currentSenseProperty.lazyLink( emitCircuitChanged );
    } );
    this.circuitElements.addItemRemovedListener( circuitElement => {

      // Delete orphaned vertices
      this.removeVertexIfOrphaned( circuitElement.startVertexProperty.get() );
      this.removeVertexIfOrphaned( circuitElement.endVertexProperty.get() );

      // Clear the selected element property so that the Edit panel for the element will disappear
      if ( this.selectedCircuitElementProperty.get() === circuitElement ) {
        this.selectedCircuitElementProperty.set( null );
      }

      circuitElement.getCircuitProperties().forEach( property => property.unlink( markDirtyListener ) );
      this.charges.removeAll( this.getChargesInCircuitElement( circuitElement ) );
      circuitElement.currentSenseProperty.unlink( emitCircuitChanged );
      this.markDirty();
    } );

    // When a Charge is removed from the list, dispose it
    this.charges.addItemRemovedListener( charge => charge.dispose() );

    // @public (read-only) {Emitter} After the circuit physics is recomputed in solve(), some listeners need to update
    // themselves, such as the voltmeter and ammeter
    this.circuitChangedEmitter = new Emitter();

    // @public (read-only) {Emitter} - Some actions only take place after an item has been dropped
    this.vertexDroppedEmitter = new Emitter( { parameters: [ { valueType: Vertex } ] } );

    // @public (read-only) {Emitter} - signifies that a component has been modified (for example, with the
    // CircuitElementNumberControl)
    this.componentEditedEmitter = new Emitter();

    const emitCircuitChanged = () => {
      this.dirty = true;
      this.circuitChangedEmitter.emit();
    };

    // @public {PhetioGroup}
    this.vertexGroup = new PhetioGroup( ( tandem, position ) => {
      return new Vertex( position, {
        tandem: tandem,
        phetioType: Vertex.VertexIO
      } );
    }, [ new Vector2( -1000, 0 ) ], {
      phetioType: PhetioGroup.PhetioGroupIO( Vertex.VertexIO ),
      tandem: tandem.createTandem( 'vertexGroup' )
    } );

    this.vertexGroup.elementCreatedEmitter.addListener( vertex => {

      // Observe the change in position of the vertices, to update the ammeter and voltmeter
      vertex.positionProperty.link( emitCircuitChanged );

      const filtered = this.vertexGroup.filter( candidateVertex => vertex === candidateVertex );
      assert && assert( filtered.length === 1, 'should only have one copy of each vertex' );

      // if one vertex becomes selected, deselect the other vertices and circuit elements
      const vertexSelectedPropertyListener = ( selected: boolean ) => {
        if ( selected ) {
          this.vertexGroup.forEach( v => {
            if ( v !== vertex ) {
              v.selectedProperty.set( false );
            }
          } );
          this.selectedCircuitElementProperty.set( null );
        }
      };
      vertex.vertexSelectedPropertyListener = vertexSelectedPropertyListener;
      vertex.selectedProperty.link( vertexSelectedPropertyListener );
    } );

    // Stop watching the vertex positions for updating the voltmeter and ammeter
    this.vertexGroup.elementDisposedEmitter.addListener( vertex => {

      // Sanity checks for the listeners
      // assert && assert( vertex.positionProperty.hasListener( emitCircuitChanged ), 'should have had the listener' );
      // vertex.positionProperty.unlink( emitCircuitChanged );

      // More sanity checks for the listeners
      assert && assert( !vertex.positionProperty.hasListener( emitCircuitChanged ), 'Listener should be removed' );

      vertex.selectedProperty.unlink( vertex.vertexSelectedPropertyListener );
      vertex.vertexSelectedPropertyListener = null;
    } );

    // @public {Property.<CircuitElement|null>} - When the user taps on a CircuitElement, it becomes selected and
    // highlighted, and shows additional controls at the bottom of the screen. When the sim launches or when the user
    // taps away from a selected circuit element, the selection is `null`.  Once this simulation is instrumented
    // for a11y, the focus property can be used to track this. Note that vertex selection is done via
    // Vertex.selectedProperty.  These strategies can be unified when we work on a11y.
    this.selectedCircuitElementProperty = new Property<CircuitElement | null>( null, {
      tandem: tandem.createTandem( 'selectedCircuitElementProperty' ),
      phetioType: Property.PropertyIO( NullableIO( ReferenceIO( CircuitElement.CircuitElementIO ) ) )
    } );

    this.selectedCircuitElementProperty.link( selectedCircuitElement => {

      // When a circuit element is selected, deselect all the vertices
      if ( selectedCircuitElement ) {
        this.vertexGroup.forEach( vertex => vertex.selectedProperty.set( false ) );
      }
    } );

    // @private {function[]} - Actions that will be invoked during the step function
    this.stepActions = [];

    // When any vertex is dropped, check it and its neighbors for overlap.  If any overlap, move them apart.
    this.vertexDroppedEmitter.addListener( vertex => {
      this.stepActions.push( () => {

        // Collect adjacent vertices
        const neighbors = this.getNeighboringVertices( vertex );

        // Also consider the vertex being dropped for comparison with neighbors
        neighbors.push( vertex );
        const pairs: Pair[] = [];
        neighbors.forEach( neighbor => {
          this.vertexGroup.forEach( vertex => {

            // Make sure nodes are different
            if ( neighbor !== vertex ) {

              // Add to the list to be checked
              pairs.push( { v1: neighbor, v2: vertex } );
            }
          } );
        } );
        if ( pairs.length > 0 ) {

          // Find the closest pair
          const distance = ( pair: Pair ) => pair.v2.unsnappedPositionProperty.get().distance( pair.v1.unsnappedPositionProperty.get() );
          const minPair = _.minBy( pairs, distance ) as Pair;
          const minDistance = distance( minPair );

          // If the pair is too close, then bump one vertex away from each other (but only if both are not user controlled)
          if ( minDistance < BUMP_AWAY_RADIUS && !minPair.v1.isDragged && !minPair.v2.isDragged ) {
            this.moveVerticesApart( minPair.v1, minPair.v2 );
          }
        }
      } );
    } );

    this.sourceResistanceProperty.link( markDirtyListener );

    // Create vertices for the API validated/baseline circuit elements.  These are not present in the vertexGroup and
    // hence not transmitted in the state.
    const createVertices = ( length: number ) => {
      const startPosition = new Vector2( -1000, 0 );
      return [ new Vertex( startPosition ), new Vertex( startPosition.plusXY( length, 0 ) ) ];
    };

    // @public {PhetioGroup}
    this.wireGroup = new PhetioGroup( ( tandem, startVertex, endVertex ) => {
      return new Wire( startVertex, endVertex, this.wireResistivityProperty, tandem );
    }, () => createVertices( WIRE_LENGTH ), {
      phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
      tandem: tandem.createTandem( 'wireGroup' )
    } );

    // @public {PhetioGroup}
    this.batteryGroup = new PhetioGroup( ( tandem, startVertex, endVertex ) => {
      return new Battery( startVertex, endVertex, this.sourceResistanceProperty, 'normal',
        tandem );
    }, () => createVertices( BATTERY_LENGTH ), {
      phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
      tandem: tandem.createTandem( 'batteryGroup' )
    } );

    // @public {PhetioGroup}
    this.highVoltageBatteryGroup = new PhetioGroup( ( tandem, startVertex, endVertex ) => {
      return new Battery( startVertex, endVertex, this.sourceResistanceProperty, 'high-voltage',
        tandem, {
          voltage: 1000
        } );
    }, () => createVertices( BATTERY_LENGTH ), {
      phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
      tandem: tandem.createTandem( 'highVoltageBatteryGroup' ),
      phetioDynamicElementName: 'battery'
    } );

    // @public {PhetioGroup}
    this.acVoltageGroup = new PhetioGroup( ( tandem, startVertex, endVertex ) => {
      return new ACVoltage( startVertex, endVertex, this.sourceResistanceProperty, tandem );
    }, () => createVertices( CCKCConstants.AC_VOLTAGE_LENGTH ), {
      phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
      tandem: tandem.createTandem( 'acVoltageGroup' )
    } );

    // @public {PhetioGroup}
    this.resistorGroup = new PhetioGroup(
      ( tandem, startVertex, endVertex, resistorType ) => resistorType === Resistor.ResistorType.DOG ?
                                                          new Dog( startVertex, endVertex, tandem ) :
                                                          new Resistor( startVertex, endVertex, resistorType, tandem ),
      () => {
        const argumentArray: any[] = createVertices( Resistor.ResistorType.RESISTOR.length );
        argumentArray.push( Resistor.ResistorType.RESISTOR );
        return argumentArray;
      }, {
        phetioType: PhetioGroup.PhetioGroupIO( Resistor.ResistorIO ),
        tandem: tandem.createTandem( 'resistorGroup' )
      } );

    // @public {PhetioGroup}
    this.fuseGroup = new PhetioGroup(
      ( tandem, startVertex, endVertex ) => new Fuse( startVertex, endVertex, tandem ),
      () => createVertices( CCKCConstants.FUSE_LENGTH ), {
        phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
        tandem: tandem.createTandem( 'fuseGroup' )
      } );

    // @public {PhetioGroup}
    this.seriesAmmeterGroup = new PhetioGroup(
      ( tandem, startVertex, endVertex ) => new SeriesAmmeter( startVertex, endVertex, tandem ),
      () => createVertices( CCKCConstants.SERIES_AMMETER_LENGTH ), {
        phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
        tandem: tandem.createTandem( 'seriesAmmeterGroup' )
      } );

    // @public {PhetioGroup}
    this.highResistanceLightBulbGroup = new PhetioGroup(
      ( tandem, startVertex, endVertex ) => {
        return LightBulb.createAtPosition( startVertex, endVertex, this, CCKCConstants.HIGH_RESISTANCE,
          this.viewTypeProperty, tandem, {
            highResistance: true
          } );
      }, () => createVertices( 100 ), {
        phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
        tandem: tandem.createTandem( 'highResistanceLightBulbGroup' )
      } );

    // @public {PhetioGroup}
    this.capacitorGroup = new PhetioGroup(
      ( tandem, startVertex, endVertex ) => new Capacitor( startVertex, endVertex, tandem ),
      () => createVertices( CCKCConstants.CAPACITOR_LENGTH ), {
        phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
        tandem: tandem.createTandem( 'capacitorGroup' )
      } );

    // @public {PhetioGroup}
    this.inductorGroup = new PhetioGroup(
      ( tandem, startVertex, endVertex ) => new Inductor( startVertex, endVertex, tandem ),
      () => createVertices( CCKCConstants.INDUCTOR_LENGTH ), {
        phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
        tandem: tandem.createTandem( 'inductorGroup' )
      } );

    // @public {PhetioGroup}
    this.switchGroup = new PhetioGroup(
      ( tandem, startVertex, endVertex ) => new Switch( startVertex, endVertex, tandem ),
      () => createVertices( CCKCConstants.SWITCH_LENGTH ), {
        phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
        tandem: tandem.createTandem( 'switchGroup' )
      } );

    // @public {PhetioGroup}
    this.lightBulbGroup = new PhetioGroup( ( tandem, startVertex, endVertex ) => {
      return new LightBulb( startVertex, endVertex, CCKCConstants.DEFAULT_RESISTANCE, this.viewTypeProperty, tandem );
    }, () => createVertices( 100 ), {
      phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
      tandem: tandem.createTandem( 'lightBulbGroup' )
    } );

    // @public {PhetioGroup}
    this.realLightBulbGroup = new PhetioGroup(
      ( tandem, startVertex, endVertex ) => {
        return new LightBulb( startVertex, endVertex, CCKCConstants.DEFAULT_RESISTANCE, this.viewTypeProperty, tandem, {
          real: true
        } );
      }, () => createVertices( 100 ), {
        phetioType: PhetioGroup.PhetioGroupIO( CircuitElement.CircuitElementIO ),
        tandem: tandem.createTandem( 'realLightBulbGroup' )
      } );

    // @private {Array.<PhetioGroup>}
    this.groups = [
      this.wireGroup,
      this.batteryGroup,
      this.highVoltageBatteryGroup,
      this.acVoltageGroup,
      this.resistorGroup,
      this.fuseGroup,
      this.capacitorGroup,
      this.inductorGroup,
      this.switchGroup,
      this.lightBulbGroup,
      this.realLightBulbGroup,
      this.highResistanceLightBulbGroup,
      this.seriesAmmeterGroup
    ];

    // @private {boolean} - whether physical characteristics have changed and warrant solving for currents and voltages
    this.dirty = false;
  }

  /**
   * @param {CircuitElement} circuitElement
   * @public
   */
  disposeCircuitElement( circuitElement: CircuitElement ) {
    this.circuitElements.remove( circuitElement );

    // Find the corresponding group that contains the circuitElement and dispose it.
    this.groups.forEach( group => group.includes( circuitElement ) && group.disposeElement( circuitElement ) );
  }

  /**
   * Create a pair of vertices to be used for a new CircuitElement
   * @param {Vector2} position - the position of the center of the CircuitElement
   * @param {number} length - the distance between the vertices
   * @returns {Vertex[]} with 2 elements
   * @private
   */
  createVertexPairArray( position: Vector2, length: number ) {
    return [
      this.createVertex( position.plusXY( -length / 2, 0 ) ),
      this.createVertex( position.plusXY( length / 2, 0 ) )
    ];
  }

  /**
   * Create a Vertex at the specified position, convenience function for creating the vertices for CircuitElements.
   * @param {Vector2} position - the position of the Vertex in view = model coordinates
   * @returns {Vertex}
   * @private
   */
  createVertex( position: Vector2 ) {
    return this.vertexGroup.createNextElement( position );
  }

  /**
   * When over Vertex is released or bumped over another Vertex, rotate one away so it doesn't appear connected.
   * @param {Vertex} v1
   * @param {Vertex} v2
   * @private
   */
  moveVerticesApart( v1: Vertex, v2: Vertex ) {
    const v1Neighbors = this.getNeighboringVertices( v1 );
    const v2Neighbors = this.getNeighboringVertices( v2 );

    // When vertex v1 is too close (but not connected) to v2, we choose vertex v3 as a reference point for moving
    // vertex v1 (or vice versa).
    if ( v1Neighbors.length === 1 && !v1.blackBoxInterfaceProperty.get() ) {
      this.bumpAwaySingleVertex( v1, v1Neighbors[ 0 ] ); // Arbitrarily choose 0th neighbor to move away from
    }
    else if ( v2Neighbors.length === 1 && !v2.blackBoxInterfaceProperty.get() ) {
      this.bumpAwaySingleVertex( v2, v2Neighbors[ 0 ] ); // Arbitrarily choose 0th neighbor to move away from
    }
  }

  /**
   * Update the position of all charges.
   * @public
   */
  relayoutAllCharges() {
    this.circuitElements.forEach( circuitElement => {circuitElement.chargeLayoutDirty = true;} );
    this.layoutChargesInDirtyCircuitElements();
  }

  /**
   * When two Vertices are dropped/bumped too close together, move away the pre-existing one by rotating or
   * translating it.
   *
   * @param {Vertex} vertex - the vertex to rotate
   * @param {Vertex} pivotVertex - the vertex to rotate about
   * @private
   */
  bumpAwaySingleVertex( vertex: Vertex, pivotVertex: Vertex ) {
    const distance = vertex.positionProperty.value.distance( pivotVertex.positionProperty.value );

    // If the vertices are too close, they must be translated away
    if ( distance < BUMP_AWAY_RADIUS ) {

      let difference = pivotVertex.positionProperty.value.minus( vertex.positionProperty.value );

      // Support when vertex is on the pivot, mainly for fuzz testing.  In that case, just move directly to the right
      if ( difference.magnitude === 0 ) {
        difference = new Vector2( 1, 0 );
      }

      const delta = difference.normalized().times( -SNAP_RADIUS * 1.5 );
      this.translateVertexGroup( vertex, delta );
    }
    else {

      // Other vertices should be rotated away, which handles non-stretchy components well. For small components like
      // batteries (which are around 100 view units long), rotate Math.PI/4. Longer components don't need to rotate
      // by such a large angle because the arc length will be proportionately longer,
      // see https://github.com/phetsims/circuit-construction-kit-common/issues/344
      const searchAngle = Math.PI / 4 * 100 / distance;
      this.rotateSingleVertexByAngle( vertex, pivotVertex, searchAngle );
      const distance1 = this.closestDistanceToOtherVertex( vertex );
      this.rotateSingleVertexByAngle( vertex, pivotVertex, -2 * searchAngle );
      const distance2 = this.closestDistanceToOtherVertex( vertex );

      assert && assert( typeof distance1 === 'number' && typeof distance2 === 'number' );
      if ( distance2! <= distance1! ) {

        // go back to the best spot
        this.rotateSingleVertexByAngle( vertex, pivotVertex, 2 * searchAngle );
      }
    }
  }

  /**
   * Rotate the given Vertex about the specified Vertex by the given angle
   * @param {Vertex} vertex - the vertex which will be rotated
   * @param {Vertex} pivotVertex - the origin about which the vertex will rotate
   * @param {number} deltaAngle - angle in radians to rotate
   * @private
   */
  rotateSingleVertexByAngle( vertex: Vertex, pivotVertex: Vertex, deltaAngle: number ) {
    const position = vertex.positionProperty.get();
    const pivotPosition = pivotVertex.positionProperty.get();

    const distanceFromVertex = position.distance( pivotPosition );
    const angle = position.minus( pivotPosition ).angle;

    const newPosition = pivotPosition.plus( Vector2.createPolar( distanceFromVertex, angle + deltaAngle ) );
    vertex.unsnappedPositionProperty.set( newPosition );
    vertex.positionProperty.set( newPosition );
  }

  /**
   * Determine the distance to the closest Vertex
   * @param {Vertex} vertex
   * @returns {number} - distance to nearest other Vertex in view coordinates
   * @private
   */
  closestDistanceToOtherVertex( vertex: Vertex ) {
    let closestDistance = null;
    for ( let i = 0; i < this.vertexGroup.count; i++ ) {
      const v = this.vertexGroup.getElement( i );
      if ( v !== vertex ) {
        const distance = v.positionProperty.get().distance( vertex.positionProperty.get() );
        if ( closestDistance === null || distance < closestDistance ) {
          closestDistance = distance;
        }
      }
    }
    return closestDistance;
  }

  /**
   * Remove all elements from the circuit.
   * @public
   */
  clear() {

    this.selectedCircuitElementProperty.reset();

    // Vertices must be cleared from the black box screen--it's not handled by clearing the circuit elements
    if ( this.blackBoxStudy ) {

      // clear references, do not dispose because some items get added back in the black box.
      this.circuitElements.clear();

      // Only dispose vertices not attached to the black box
      const toDispose = this.vertexGroup.filter( vertex => !vertex.blackBoxInterfaceProperty.value );
      toDispose.forEach( vertex => this.vertexGroup.disposeElement( vertex ) );

      this.markDirty();
    }
    else {

      // Dispose of elements
      while ( this.circuitElements.length > 0 ) {
        const circuitElement = this.circuitElements[ 0 ];
        this.disposeCircuitElement( circuitElement );
        this.removeVertexIfOrphaned( circuitElement.startVertexProperty.value );
        this.removeVertexIfOrphaned( circuitElement.endVertexProperty.value );
      }
      assert && assert( this.vertexGroup.count === 0, 'vertices should have been removed' );
    }
  }

  /**
   * Split the Vertex into separate vertices.
   * @param {Vertex} vertex - the vertex to be cut.
   * @public
   */
  cutVertex( vertex: Vertex ) {

    // Only permit cutting a non-dragged vertex, see https://github.com/phetsims/circuit-construction-kit-common/issues/414
    if ( vertex.isDragged ) {
      return;
    }
    let neighborCircuitElements = this.getNeighborCircuitElements( vertex );
    if ( neighborCircuitElements.length <= 1 ) {

      // No work necessary for an unattached vertex
      return;
    }

    // Only move interactive circuit elements
    neighborCircuitElements = neighborCircuitElements.filter( circuitElement => circuitElement.interactiveProperty.get() );

    /**
     * Function that identifies where vertices would go if pulled toward their neighbors
     * @returns {Vector2[]}
     */
    const getTranslations = () => {
      return neighborCircuitElements.map( circuitElement => {
        const oppositePosition = circuitElement.getOppositeVertex( vertex ).positionProperty.get();
        const position = vertex.positionProperty.get();
        let delta = oppositePosition.minus( position );

        // If the vertices were at the same position, move them randomly.  See https://github.com/phetsims/circuit-construction-kit-common/issues/405
        if ( delta.magnitude === 0 ) {
          delta = Vector2.createPolar( 1, dotRandom.nextDouble() * Math.PI * 2 );
        }
        return delta.withMagnitude( 30 );
      } );
    };

    // Track where they would go if they moved toward their opposite vertices
    let translations = getTranslations();
    let angles = translations.map( t => t.angle );

    if ( neighborCircuitElements.length > 2 ) {

      // Reorder elements based on angle so they don't cross over when spread out
      neighborCircuitElements = _.sortBy( neighborCircuitElements, n => {
        const index = neighborCircuitElements.indexOf( n );
        return angles[ index ];
      } );

      // Get the angles in the corrected order
      translations = getTranslations();
      angles = translations.map( t => t.angle );
    }

    const separation = Math.PI * 2 / neighborCircuitElements.length;
    let results: Vector2[] = []; // TODO: tuple?

    const centerAngle = _.sum( angles ) / angles.length;

    // Move vertices away from cut vertex so that wires don't overlap
    if ( neighborCircuitElements.length === 2 ) {

      const ax = Vector2.createPolar( 30, centerAngle - separation / neighborCircuitElements.length );
      const bx = Vector2.createPolar( 30, centerAngle + separation / neighborCircuitElements.length );

      const deltaAngle = angles[ 0 ] - centerAngle;

      results = deltaAngle < 0 ? [ ax, bx ] : [ bx, ax ];
    }
    else {
      const distance = neighborCircuitElements.length <= 5 ? 30 : neighborCircuitElements.length * 30 / 5;
      neighborCircuitElements.forEach( ( circuitElement, k ) => {
        results.push( Vector2.createPolar( distance, separation * k + angles[ 0 ] ) );
      } );
    }

    neighborCircuitElements.forEach( ( circuitElement, i ) => {

      // Add the new vertex to the model first so that it can be updated in subsequent calls
      const newVertex = this.vertexGroup.createNextElement( vertex.positionProperty.get() );

      circuitElement.replaceVertex( vertex, newVertex );

      // Bump the vertices away from the original vertex
      this.translateVertexGroup( newVertex, results[ i ] );
    } );

    if ( !vertex.blackBoxInterfaceProperty.get() ) {
      this.vertexGroup.disposeElement( vertex );
    }
    this.markDirty();
  }

  /**
   * Translate all vertices connected to the mainVertex by FixedCircuitElements by the given distance
   *
   * Note: do not confuse this with CircuitLayerNode.translateVertexGroup which proposes connections while dragging
   *
   * @param {Vertex} mainVertex - the vertex whose group will be translated
   * @param {Vector2} delta - the vector by which to move the vertex group
   * @private
   */
  translateVertexGroup( mainVertex: Vertex, delta: Vector2 ) {
    const vertexArray = this.findAllFixedVertices( mainVertex );

    for ( let j = 0; j < vertexArray.length; j++ ) {
      const vertex = vertexArray[ j ];

      // Only translate vertices that are movable and not connected to the black box interface by FixedLength elements
      if ( vertex.draggableProperty.get() && !this.hasFixedConnectionToBlackBoxInterfaceVertex( vertex ) ) {
        vertex.setPosition( vertex.positionProperty.value.plus( delta ) );
      }
    }
  }

  /**
   * Returns true if the given vertex has a fixed connection to a black box interface vertex.
   * @param {Vertex} vertex
   * @returns {boolean}
   * @private
   */
  hasFixedConnectionToBlackBoxInterfaceVertex( vertex: Vertex ) {
    const fixedVertices = this.findAllFixedVertices( vertex );
    return _.some( fixedVertices, fixedVertex => fixedVertex.blackBoxInterfaceProperty.get() );
  }

  /**
   * Returns true if the CircuitElement is not connected to any other CircuitElement.
   * @param {CircuitElement} circuitElement
   * @returns {boolean}
   * @public
   */
  isSingle( circuitElement: CircuitElement ) {
    return this.getNeighborCircuitElements( circuitElement.startVertexProperty.get() ).length === 1 &&
           this.getNeighborCircuitElements( circuitElement.endVertexProperty.get() ).length === 1;
  }

  /**
   * When removing a CircuitElement, also remove its start/end Vertex if it can be removed.
   * @param {Vertex} vertex
   * @private
   */
  removeVertexIfOrphaned( vertex: Vertex ) {
    if (
      this.getNeighborCircuitElements( vertex ).length === 0 &&
      !vertex.blackBoxInterfaceProperty.get() &&
      !vertex.isDisposed
    ) {
      this.vertexGroup.disposeElement( vertex );
    }
  }

  /**
   * Get all of the CircuitElements that contain the given Vertex.
   * @param {Vertex} vertex
   * @returns {CircuitElement[]}
   * @public
   */
  getNeighborCircuitElements( vertex: Vertex ) {
    return this.circuitElements.filter( circuitElement => circuitElement.containsVertex( vertex ) );
  }

  /**
   * Gets the number of CircuitElements connected to the specified Vertex
   * @param {Vertex} vertex
   * @returns {number}
   * @public
   */
  countCircuitElements( vertex: Vertex ) {
    return this.circuitElements.count( circuitElement => circuitElement.containsVertex( vertex ) );
  }

  /**
   * Gets the voltage between two points.  Computed in the view because view coordinates are used in the computation.
   * @param {VoltageConnection} redConnection
   * @param {VoltageConnection} blackConnection
   * @param {boolean} revealing - whether the black box is in "reveal" model
   * @returns {number|null}
   *
   * @public
   */
  getVoltageBetweenConnections( redConnection: VoltageConnection | null, blackConnection: VoltageConnection | null, revealing: boolean ) {

    if ( redConnection === null || blackConnection === null ) {
      return null;
    }
    else if ( !this.areVerticesElectricallyConnected( redConnection.vertex, blackConnection.vertex ) ) {

      // Voltmeter probes each hit things but they were not connected to each other through the circuit.
      return null;
    }
    else if ( redConnection.vertex.insideTrueBlackBoxProperty.get() && !revealing ) {

      // Cannot read values inside the black box, unless "reveal" is being pressed
      return null;
    }
    else if ( blackConnection.vertex.insideTrueBlackBoxProperty.get() && !revealing ) {

      // Cannot read values inside the black box, unless "reveal" is being pressed
      return null;
    }
    else {
      return redConnection.voltage - blackConnection.voltage;
    }
  }

  /**
   * Determines whether the specified Vertices are electrically connected through any arbitrary connections.  An
   * open switch breaks the connection.
   * @param {Vertex} vertex1
   * @param {Vertex} vertex2
   * @returns {boolean}
   * @public
   */
  areVerticesElectricallyConnected( vertex1: Vertex, vertex2: Vertex ) {
    const connectedVertices = this.searchVertices( vertex1, ( startVertex, circuitElement ) => {

        // If the circuit element has a closed property (like a Switch), it is only OK to traverse if the element is
        // closed.
        if ( circuitElement instanceof Switch ) {
          return circuitElement.closedProperty.get();
        }
        else {

          // Everything else is traversible
          return true;
        }
      }
    );
    return connectedVertices.indexOf( vertex2 ) >= 0;
  }

  /**
   * When some physical characteristic has changed, we must recompute the voltages and currents.  Mark as
   * dirty and compute in step if anything has changed.
   * @public
   */
  markDirty() {
    this.dirty = true;
  }

  /**
   * Connect the vertices, merging oldVertex into vertex1 and deleting oldVertex
   * @param {Vertex} targetVertex
   * @param {Vertex} oldVertex
   * @public
   */
  connect( targetVertex: Vertex, oldVertex: Vertex ) {
    assert && assert( targetVertex.attachableProperty.get() && oldVertex.attachableProperty.get(),
      'both vertices should be attachable' );

    // Keep the black box vertices
    if ( oldVertex.blackBoxInterfaceProperty.get() ) {
      assert && assert( !targetVertex.blackBoxInterfaceProperty.get(), 'cannot attach black box interface vertex ' +
                                                                       'to black box interface vertex' );
      this.connect( oldVertex, targetVertex );
    }
    else {
      this.circuitElements.forEach( circuitElement => {
        if ( circuitElement.containsVertex( oldVertex ) ) {
          circuitElement.replaceVertex( oldVertex, targetVertex );
          circuitElement.connectedEmitter.emit();
        }
      } );
      this.vertexGroup.disposeElement( oldVertex );
      assert && assert( !oldVertex.positionProperty.hasListeners(), 'Removed vertex should not have any listeners' );
      this.markDirty();

      // Make sure the solder is displayed in the correct z-order
      targetVertex.relayerEmitter.emit();
    }
  }

  /**
   * Move forward in time
   * @param {number} dt - the elapsed time in seconds
   * @public
   */
  step( dt: number ) {

    // Invoke any scheduled actions
    this.stepActions.forEach( stepAction => stepAction() );
    this.stepActions.length = 0;

    // Move forward time
    this.timeProperty.value += dt;

    const stepElements = this.circuitElements.filter( element => element.step );
    const dynamicElements = this.circuitElements.filter( element => element instanceof DynamicCircuitElement );
    stepElements.forEach( element => element.step( this.timeProperty.value, dt, this ) );

    if ( this.dirty || stepElements.length > 0 || dynamicElements.length > 0 ) {
      LinearTransientAnalysis.solveModifiedNodalAnalysis( this, dt );
      this.dirty = false;

      // check the incoming and outgoing current to each inductor.  If it is all 0, then clear the inductor.
      const inductors = this.circuitElements.filter( element => element instanceof Inductor ) as Inductor[];
      inductors.forEach( ( inductor: Inductor ) => {

        const hasCurrent = ( vertex: Vertex ) => {
          const neighborsWithCurrent = this.getNeighborCircuitElements( vertex )
            .filter( neighbor => neighbor !== inductor )
            .filter( neighbor => Math.abs( neighbor.currentProperty.value ) > 1E-4 );
          return neighborsWithCurrent.length > 0;
        };

        // TODO: Could this be causing https://github.com/phetsims/circuit-construction-kit-common/issues/758 ? But it doesn't get triggered
        if ( !hasCurrent( inductor.startVertexProperty.value ) && !hasCurrent( inductor.endVertexProperty.value ) ) {
          inductor.clear();
        }
      } );

      this.circuitChangedEmitter.emit();
    }

    this.determineSenses();

    // Move the charges.  Do this after the circuit has been solved so the conventional current will have the correct
    // current values.
    this.chargeAnimator.step( dt );
  }

  /**
   * When a circuit element is marked as dirty (such as when it changed length or moved), it needs to have
   * the charges repositioned, so they will be equally spaced internally and spaced well compared to neighbor
   * elements.
   * @public
   */
  layoutChargesInDirtyCircuitElements() {
    this.circuitElements.forEach( circuitElement => this.layoutCharges( circuitElement ) );
  }

  /**
   * Determine if one Vertex is adjacent to another Vertex.  The only way for two vertices to be adjacent is for them
   * to be the start/end of a single CircuitElement
   * @param {Vertex} a
   * @param {Vertex} b
   * @returns {boolean}
   * @private
   */
  isVertexAdjacent( a: Vertex, b: Vertex ) {

    // A vertex cannot be adjacent to itself.
    if ( a === b ) {
      return false;
    }

    return this.circuitElements.some( circuitElement => circuitElement.containsBothVertices( a, b ) );
  }

  /**
   * Find the neighbor vertices within the given group of circuit elements
   * @param {Vertex} vertex
   * @param {CircuitElement[]} circuitElements - the group of CircuitElements within which to look for neighbors
   * @returns {Vertex[]}
   * @private
   */
  getNeighborVerticesInGroup( vertex: Vertex, circuitElements: CircuitElement[] ) {
    const neighbors = [];
    for ( let i = 0; i < circuitElements.length; i++ ) {
      const circuitElement = circuitElements[ i ];
      if ( circuitElement.containsVertex( vertex ) ) {
        neighbors.push( circuitElement.getOppositeVertex( vertex ) );
      }
    }
    return neighbors;
  }

  /**
   * Get an array of all the vertices adjacent to the specified Vertex.
   * @param {Vertex} vertex - the vertex to get neighbors for
   * @returns {Vertex[]}
   * @private
   */
  getNeighboringVertices( vertex: Vertex ) {
    const neighborCircuitElements = this.getNeighborCircuitElements( vertex );
    return this.getNeighborVerticesInGroup( vertex, neighborCircuitElements );
  }

  /**
   * Marks all connected circuit elements as dirty (so electrons will be layed out again), called when any wire length is changed.
   * @param {Vertex} vertex
   * @private
   */
  markAllConnectedCircuitElementsDirty( vertex: Vertex ) {
    const allConnectedVertices = this.findAllConnectedVertices( vertex );

    // This is called many times while dragging a wire vertex, so for loops (as opposed to functional style) are used
    // to avoid garbage
    for ( let i = 0; i < allConnectedVertices.length; i++ ) {
      const neighborCircuitElements = this.getNeighborCircuitElements( allConnectedVertices[ i ] );
      for ( let k = 0; k < neighborCircuitElements.length; k++ ) {

        // Note the same circuit element may be marked dirty twice, but this does not cause any problems.
        neighborCircuitElements[ k ].chargeLayoutDirty = true;
      }
    }
    this.dirty = true;
  }

  /**
   * Find the subgraph where all vertices are connected by any kind of CircuitElements
   * @param {Vertex} vertex
   * @public
   */
  findAllConnectedVertices( vertex: Vertex ) {
    return this.searchVertices( vertex, trueFunction );
  }

  // Identify current senses for 'unspecified' CircuitElements with a nonzero current
  determineSenses() {

    // Disconnected circuit elements forget their sense
    this.circuitElements.forEach( c => {
      if ( c.currentProperty.value === 0.0 ) {
        c.currentSenseProperty.value = 'unspecified';
      }
    } );

    // Filter based on whether CircuitElements have current beforehand, currents cannot change in this loop
    const circuitElementsWithCurrent = this.circuitElements.filter( c => c.currentProperty.value !== 0 );

    // After assigning a sense, revisit the circuit to propagate senses.  Break out of the loop when no more work can be done
    while ( true ) { // eslint-disable-line

      const requiresSenseBeforeVisit = circuitElementsWithCurrent.filter( c => c.currentSenseProperty.value === 'unspecified' );
      if ( requiresSenseBeforeVisit.length === 0 ) {
        break;
      }

      // Propagate known senses to new circuit elements.
      this.propagateSenses();

      const requiresSenseAfterVisit = circuitElementsWithCurrent.filter( c => c.currentSenseProperty.value === 'unspecified' );

      if ( requiresSenseAfterVisit.length === 0 ) {
        break;
      }

      let wasSenseAssigned = false;

      // Match AC Sources so they are in phase
      const unspecifiedACSources = requiresSenseAfterVisit.filter( r => r instanceof ACVoltage );
      if ( unspecifiedACSources.length > 0 ) {
        const unspecifiedACSource = unspecifiedACSources[ 0 ];
        const referenceElements = this.circuitElements.filter( c => c instanceof ACVoltage && c.currentSenseProperty.value !== 'unspecified' && c !== unspecifiedACSource );
        if ( referenceElements.length > 0 ) {
          Circuit.assignSense( unspecifiedACSource, referenceElements[ 0 ] );
          wasSenseAssigned = true;

          // Run the next iteration of the loop, which will search out from the newly marked node
          // TODO: Only search from the newly marked node?
        }
      }

      if ( !wasSenseAssigned ) {

        // TODO: Prefer a circuit element that has only 2 neighbors, so it is a series element?
        const targetElement = requiresSenseAfterVisit[ 0 ];
        targetElement.currentSenseProperty.value = getSenseForPositive( targetElement.currentProperty.value );
        wasSenseAssigned = true;
      }
    }
  }

  // Assign the sense to an un-sensed circuit element based on matching the sign of a corresponding reference element.
  static assignSense( targetElement: CircuitElement, referenceElement: CircuitElement ) {
    assert && assert( targetElement.currentSenseProperty.value === 'unspecified', 'target should have an unspecified sense' );
    const targetElementCurrent = targetElement.currentProperty.value;
    const referenceElementCurrent = referenceElement.currentProperty.value;
    const referenceElementSense = referenceElement.currentSenseProperty.value;
    const desiredSign = referenceElementCurrent >= 0 && referenceElementSense === 'forward' ? 'positive' :
                        referenceElementCurrent >= 0 && referenceElementSense === 'backward' ? 'negative' :
                        referenceElementCurrent < 0 && referenceElementSense === 'forward' ? 'negative' :
                        referenceElementCurrent < 0 && referenceElementSense === 'backward' ? 'positive' :
                        'error';

    assert && assert( desiredSign !== 'error' );
    targetElement.currentSenseProperty.value = desiredSign === 'positive' ?
                                               getSenseForPositive( targetElementCurrent ) :
                                               getSenseForNegative( targetElementCurrent );
  }

  // Traverse the circuit, filling in senses to adjacent circuit elements during the traversal
  propagateSenses() {

    const circuitElementsWithSenses = this.circuitElements.filter( c => c.currentSenseProperty.value !== 'unspecified' );
    if ( circuitElementsWithSenses.length > 0 ) {

      // launch searches from circuit elements with known senses
      const toVisit: Vertex[] = [];
      circuitElementsWithSenses.forEach( c => {
        if ( !toVisit.includes( c.startVertexProperty.value ) ) { toVisit.push( c.startVertexProperty.value ); }
        if ( !toVisit.includes( c.endVertexProperty.value ) ) { toVisit.push( c.endVertexProperty.value ); }
      } );

      const visited: Vertex[] = [];
      while ( toVisit.length > 0 ) {
        const vertex = toVisit.pop()!;
        if ( !visited.includes( vertex ) ) {
          const neighborCircuitElements = this.getNeighborCircuitElements( vertex );
          for ( let i = 0; i < neighborCircuitElements.length; i++ ) {
            const circuitElement = neighborCircuitElements[ i ];
            const neighborVertex = circuitElement.getOppositeVertex( vertex );

            if ( circuitElement.currentSenseProperty.value === 'unspecified' && circuitElement.currentProperty.value !== 0.0 ) {

              // choose sense from a neighbor. We discussed that we may need to be more selective in choosing the reference
              // neighbor, such as choosing the high voltage side's highest voltage neighbor.  However, we didn't see a
              // case where that was necessary yet.
              const specifiedNeighbors = neighborCircuitElements.filter( c => c !== circuitElement && c.currentSenseProperty.value !== 'unspecified' );
              if ( specifiedNeighbors.length > 0 ) {
                Circuit.assignSense( circuitElement, specifiedNeighbors[ 0 ] );
              }
            }

            // TODO: Stop the search if we crossed a circuit element that already has a sense, since it is already marked for visit?
            if ( !visited.includes( neighborVertex ) && !toVisit.includes( neighborVertex ) ) {
              toVisit.push( neighborVertex );
            }
          }
          visited.push( vertex );
        }
      }
    }
  }

  /**
   * Find the subgraph where all vertices are connected, given the list of traversible circuit elements.
   * There are a few other ad-hoc graph searches around, such as isInLoop and in LinearTransientAnalysis
   * @param {Vertex} vertex
   * @param {function} okToVisit - (startVertex:Vertex,circuitElement:CircuitElement,endVertex:Vertex)=>boolean, rule
   *                             - that determines which vertices are OK to visit
   * @returns {Vertex[]}
   * @private
   */
  searchVertices( vertex: Vertex, okToVisit: ( a: Vertex, c: CircuitElement, b: Vertex ) => boolean ) {

    const fixedVertices = [];
    const toVisit: Vertex[] = [ vertex ];
    const visited = [];
    while ( toVisit.length > 0 ) {

      // Find the neighbors joined by a FixedCircuitElement, not a stretchy Wire
      const currentVertex = toVisit.pop() as Vertex;

      // If we haven't visited it before, then explore it
      if ( visited.indexOf( currentVertex ) < 0 ) {

        const neighborCircuitElements = this.getNeighborCircuitElements( currentVertex );

        for ( let i = 0; i < neighborCircuitElements.length; i++ ) {
          const neighborCircuitElement = neighborCircuitElements[ i ];
          const neighborVertex = neighborCircuitElement.getOppositeVertex( currentVertex );

          // If the node was already visited, don't visit again
          if ( visited.indexOf( neighborVertex ) < 0 &&
               toVisit.indexOf( neighborVertex ) < 0 &&
               okToVisit( currentVertex, neighborCircuitElement, neighborVertex ) ) {
            toVisit.push( neighborVertex );
          }
        }
      }

      fixedVertices.push( currentVertex ); // Allow duplicates, will be _.uniq before return

      // O(n^2) to search for duplicates as we go, if this becomes a performance bottleneck we may wish to find a better
      // way to deduplicate, perhaps Set or something like that
      if ( visited.indexOf( currentVertex ) < 0 ) {
        visited.push( currentVertex );
      }
    }
    return _.uniq( fixedVertices );
  }

  /**
   * Returns true if the circuit element is in a loop with a voltage source
   * @param {CircuitElement} circuitElement
   * @returns {boolean}
   * @public
   */
  isInLoop( circuitElement: CircuitElement ) {

    // Special case for when we are asking if an open Switch is in a loop.  Open switches
    // cannot be in a loop since their vertices are not directly connected.  Note the search
    // algorithm below gives the wrong answer because the start vertex and end vertex can be connected
    // by other circuit elements.
    if ( circuitElement instanceof Switch && !circuitElement.closedProperty.value ) {
      return false;
    }

    // procedure DFS_iterative(G, v) is
    // let S be a stack
    // S.push(v)
    // while S is not empty do
    //   v = S.pop()
    //   if v is not labeled as discovered then
    //     label v as discovered
    //     for all edges from v to w in G.adjacentEdges(v) do
    //       S.push(w)

    // Iterative (not recursive) depth first search, so we can bail on a hit, see https://en.wikipedia.org/wiki/Depth-first_search
    const stack = [];
    const visited: Vertex[] = [];
    stack.push( circuitElement.startVertexProperty.value );
    while ( stack.length > 0 ) {
      const vertex = stack.pop() as Vertex;
      if ( !visited.includes( vertex ) ) {
        visited.push( vertex );

        for ( let i = 0; i < this.circuitElements.length; i++ ) {
          const neighbor = this.circuitElements[ i ];

          if ( neighbor.containsVertex( vertex ) &&

               // no shortcuts!
               neighbor !== circuitElement &&

               // can't cross an open switch
               !( neighbor instanceof Switch && !neighbor.closedProperty.value ) ) {
            const opposite = neighbor.getOppositeVertex( vertex );
            if ( opposite === circuitElement.endVertexProperty.value ) {

              // Hooray, we found a loop!
              return true;
            }
            stack.push( opposite );
          }
        }
      }
    }
    return false;
  }

  /**
   * Get the charges that are in the specified circuit element.
   * @param {CircuitElement} circuitElement
   * @returns {Charge[]}
   * @public
   */
  getChargesInCircuitElement( circuitElement: CircuitElement ) {
    return this.charges.filter( charge => charge.circuitElement === circuitElement );
  }

  /**
   * Find the subgraph where all vertices are connected by FixedCircuitElements, not stretchy wires.
   * @param {Vertex} vertex
   * @param {function} [okToVisit] - (startVertex:Vertex,circuitElement:CircuitElement,endVertex:Vertex)=>boolean,
   *                               - rule that determines which vertices are OK to visit
   * @returns {Vertex[]}
   * @public
   */
  findAllFixedVertices( vertex: Vertex, okToVisit: ( ( a: Vertex, c: CircuitElement, b: Vertex ) => boolean ) = e => true ) {
    return this.searchVertices( vertex, ( startVertex: Vertex, circuitElement: CircuitElement, endVertex: Vertex ) => {
      if ( okToVisit ) {
        return circuitElement instanceof FixedCircuitElement && okToVisit( startVertex, circuitElement, endVertex );
      }
      else {
        return circuitElement instanceof FixedCircuitElement;
      }
    } );
  }

  /**
   * Returns the selected Vertex or null if none is selected
   * @returns {Vertex|null}
   * @public
   */
  getSelectedVertex(): Vertex | null {
    const selectedVertex = _.find( this.vertexGroup.getArray(), vertex => vertex.selectedProperty.get() );
    return ( selectedVertex || null ) as ( Vertex | null );
  }

  /**
   * A vertex has been dragged, is it a candidate for joining with other vertices?  If so, return the candidate
   * vertex.  Otherwise, return null.
   * @param {Vertex} vertex - the dragged vertex
   * @param {InteractionMode} mode - the application mode Circuit.InteractionMode.TEST | Circuit.InteractionMode.EXPLORE
   * @param {Bounds2|undefined} blackBoxBounds - the bounds of the black box, if there is one
   * @returns {Vertex|null} - the vertex it will be able to connect to, if dropped or null if no connection is available
   * @public
   */
  getDropTarget( vertex: Vertex, mode: InteractionMode, blackBoxBounds: Bounds2 | null ) { // TODO Enum for InteractionMode

    if ( mode === 'test' ) {
      assert && assert( blackBoxBounds, 'bounds should be provided for build mode' );
    }

    // Rules for a vertex connecting to another vertex.
    let candidateVertices = this.vertexGroup.filter( candidateVertex => {

      // (1) A vertex may not connect to an adjacent vertex.
      if ( this.isVertexAdjacent( vertex, candidateVertex ) ) {
        return false;
      }

      // (2) A vertex cannot connect to itself
      if ( candidateVertex === vertex ) {
        return false;
      }

      // (2.5) cannot connect to something that is dragging
      if ( candidateVertex.isDragged ) {
        return false;
      }

      // (3) a vertex must be within SNAP_RADIUS (screen coordinates) of the other vertex
      if ( !( vertex.unsnappedPositionProperty.get().distance( candidateVertex.positionProperty.get() ) < SNAP_RADIUS ) ) {
        return false;
      }

      // (4) a vertex must be attachable. Some black box vertices are not attachable, such as vertices hidden in the box
      if ( !candidateVertex.attachableProperty.get() ) {
        return false;
      }

      // (5) Reject any matches that result in circuit elements sharing a pair of vertices, which would cause
      // the wires to lay across one another (one vertex was already shared)

      // if something else is already snapping to candidateVertex, then we cannot snap to it as well.
      // check the neighbor vertices
      for ( let i = 0; i < this.vertexGroup.count; i++ ) {
        const circuitVertex = this.vertexGroup.getElement( i );
        const adjacent = this.isVertexAdjacent( circuitVertex, vertex );

        // If the adjacent vertex has the same position as the candidate vertex, that means it is already "snapped"
        // there and hence another vertex should not snap there at the same time.
        if ( adjacent && circuitVertex.positionProperty.get().equals( candidateVertex.positionProperty.get() ) ) {
          return false;
        }
      }

      const fixedVertices = this.findAllFixedVertices( vertex );

      // (6) a vertex cannot be connected to its own fixed subgraph (no wire)
      for ( let i = 0; i < fixedVertices.length; i++ ) {
        if ( fixedVertices[ i ] === candidateVertex ) {
          return false;
        }
      }

      // (7) a wire vertex cannot connect if its neighbor is already proposing a connection
      // You can always attach to a black box interface
      if ( !candidateVertex.blackBoxInterfaceProperty.get() ) {
        const neighbors = this.getNeighborCircuitElements( candidateVertex );
        for ( let i = 0; i < neighbors.length; i++ ) {
          const neighbor = neighbors[ i ];
          const oppositeVertex = neighbor.getOppositeVertex( candidateVertex );

          // is another node proposing a match to that node?
          for ( let k = 0; k < this.vertexGroup.count; k++ ) {
            const v = this.vertexGroup.getElement( k );
            if ( neighbor instanceof Wire &&
                 v !== vertex &&
                 v !== oppositeVertex &&
                 v.positionProperty.get().equals( oppositeVertex.positionProperty.get() ) &&
                 v.isDragged
            ) {
              return false;
            }
          }
        }
      }

      // (8) a wire vertex cannot double connect to an object, creating a tiny short circuit
      const candidateNeighbors = this.getNeighboringVertices( candidateVertex );
      const myNeighbors = this.getNeighboringVertices( vertex );
      const intersection = _.intersection( candidateNeighbors, myNeighbors );
      if ( intersection.length !== 0 ) {
        return false;
      }

      // All tests passed, it's OK for connection
      return true;
    } );

    // TODO (black-box-study): integrate rule (9) with the other rules above
    // (9) When in Black Box "build" mode (i.e. building inside the black box), a vertex user cannot connect to
    // a black box interface vertex if its other vertices would be outside of the black box.  See #136
    if ( mode === 'test' ) {
      const boxBounds = blackBoxBounds as Bounds2;
      const fixedVertices2 = this.findAllFixedVertices( vertex );
      candidateVertices = candidateVertices.filter( candidateVertex => {

        // Don't connect to vertices that might have sneaked outside of the black box, say by a rotation.
        if ( !candidateVertex.blackBoxInterfaceProperty.get() && !boxBounds.containsPoint( candidateVertex.positionProperty.get() ) ) {
          return false;
        }

        // How far the vertex would be moved if it joined to the candidate
        const delta = candidateVertex.positionProperty.get().minus( vertex.positionProperty.get() );

        if ( candidateVertex.blackBoxInterfaceProperty.get() || boxBounds.containsPoint( candidateVertex.positionProperty.get() ) ) {
          for ( let i = 0; i < fixedVertices2.length; i++ ) {
            const connectedVertex = fixedVertices2[ i ];
            if ( connectedVertex.blackBoxInterfaceProperty.get() ) {

              // OK for black box interface vertex to be slightly outside the box
            }
            else if ( connectedVertex !== vertex && !boxBounds.containsPoint( connectedVertex.positionProperty.get().plus( delta ) ) &&

                      // exempt wires connected outside of the black box, which are flagged as un-attachable in build mode, see #141
                      connectedVertex.attachableProperty.get() ) {
              return false;
            }
          }
        }
        else {
          return true;
        }
        return true;
      } );

      // a vertex must be attachable. Some black box vertices are not attachable, such as vertices hidden in the box
      candidateVertices = candidateVertices.filter( candidateVertex => !candidateVertex.outerWireStub );
    }
    if ( candidateVertices.length === 0 ) { return null; }

    // Find the closest match
    const sorted = _.sortBy( candidateVertices, candidateVertex =>
      vertex.unsnappedPositionProperty.get().distance( candidateVertex.positionProperty.get() )
    );
    return sorted[ 0 ];
  }

  // @public
  // A reporting tool to indicate whether current is conserved at each vertex
  checkCurrentConservation( index: number ) {
    console.log( '####### ' + index );
    // the sum of currents flowing into the vertex should be 0
    this.vertexGroup.forEach( vertex => {
      const neighbors = this.getNeighborCircuitElements( vertex );
      let sum = 0;
      neighbors.forEach( neighbor => {
        const sign = neighbor.startVertexProperty.value === vertex ? +1 : -1;
        const current = sign * neighbor.currentProperty.value;
        sum += current;
      } );
      console.log( `${vertex.index}: ${sum}` );
    } );
  }

  /**
   * Due to numerical floating point errors, current may not be exactly conserved.  But we don't want to show electrons
   * moving in some part of a loop but not others, so we manually enforce current conservation at each vertex.
   * @param {Vertex} vertex
   * @param {CircuitElement[]} locked
   * @public
   */
  conserveCurrent( vertex: Vertex, locked: CircuitElement[] ) {
    // the sum of currents flowing into the vertex should be 0
    const neighbors = this.getNeighborCircuitElements( vertex );
    let sum = 0;
    neighbors.forEach( neighbor => {
      const sign = neighbor.startVertexProperty.value === vertex ? +1 : -1;
      const current = sign * neighbor.currentProperty.value;
      sum += current;
    } );

    // If the amount of unconserved current is too high, then try to adjust other currents to compensate
    if ( Math.abs( sum ) > 1E-10 ) {

      // divide the problem to all mutable (participant), non-locked neighbors
      const unlockedNeighbors = neighbors.filter( n => !locked.includes( n ) );
      const overflow = sum / unlockedNeighbors.length;
      unlockedNeighbors.forEach( neighbor => {
        const sign = neighbor.startVertexProperty.value === vertex ? +1 : -1;
        neighbor.currentProperty.value += -sign * overflow;
        locked.push( neighbor );
      } );
    }
  }

  /**
   * Flip the given CircuitElement
   * @param {CircuitElement} circuitElement - the circuit element to flip
   * @public
   */
  flip( circuitElement: CircuitElement ) {
    const startVertex = circuitElement.startVertexProperty.value;
    const endVertex = circuitElement.endVertexProperty.value;
    circuitElement.startVertexProperty.value = endVertex;
    circuitElement.endVertexProperty.value = startVertex;

    const flipped = circuitElement.currentSenseProperty.value === 'forward' ? 'backward' :
                    circuitElement.currentSenseProperty.value === 'backward' ? 'forward' :
                    'unspecified';
    circuitElement.currentSenseProperty.value = flipped;

    // Layout the charges in the circuitElement but nowhere else, since that creates a discontinuity in the motion
    circuitElement.chargeLayoutDirty = true;
    this.layoutChargesInDirtyCircuitElements();
    this.markDirty();
  }

  /**
   * Creates and positions charges in the specified circuit element.
   * @param {CircuitElement} circuitElement - the circuit element within which the charges will be updated
   * @public
   */
  layoutCharges( circuitElement: CircuitElement ) {

    // Avoid unnecessary work to improve performance
    if ( circuitElement.chargeLayoutDirty ) {

      circuitElement.chargeLayoutDirty = false;

      // Identify charges that were already in the branch.
      const charges = this.getChargesInCircuitElement( circuitElement );

      // put charges 1/2 separation from the edge so it will match up with adjacent components
      const offset = CCKCConstants.CHARGE_SEPARATION / 2;
      const lastChargePosition = circuitElement.chargePathLength - offset;
      const firstChargePosition = offset;
      const lengthForCharges = lastChargePosition - firstChargePosition;

      // Utils.roundSymmetric leads to charges too far apart when N=2
      const numberOfCharges = Math.ceil( lengthForCharges / CCKCConstants.CHARGE_SEPARATION );

      // compute distance between adjacent charges
      const spacing = lengthForCharges / ( numberOfCharges - 1 );

      for ( let i = 0; i < numberOfCharges; i++ ) {

        // If there is a single particle, show it in the middle of the component, otherwise space equally
        const chargePosition = numberOfCharges === 1 ?
                               ( firstChargePosition + lastChargePosition ) / 2 :
                               i * spacing + offset;

        const desiredCharge = this.currentTypeProperty.get() === 'electrons' ? -1 : +1;

        if ( charges.length > 0 &&
             charges[ 0 ].charge === desiredCharge &&
             charges[ 0 ].circuitElement === circuitElement &&
             charges[ 0 ].visibleProperty === this.showCurrentProperty ) {

          const c = charges.shift() as Charge; // remove 1st element, since it's the charge we checked in the guard
          c.circuitElement = circuitElement;
          c.distance = chargePosition;
          c.updatePositionAndAngle();
        }
        else {

          // nothing suitable in the pool, create something new
          const charge = new Charge( circuitElement, chargePosition, this.showCurrentProperty, desiredCharge );
          this.charges.add( charge );
        }
      }

      // Any charges that did not get recycled should be removed
      this.charges.removeAll( charges );
    }
  }

  // @public - only works in unbuilt mode
  toString() {
    return this.circuitElements.map( c => c.constructor.name ).join( ', ' );
  }

  /**
   * Reset the Circuit to its initial state.
   * @public
   */
  reset() {
    this.clear();
    this.showCurrentProperty.reset();
    this.currentTypeProperty.reset();
    this.wireResistivityProperty.reset();
    this.sourceResistanceProperty.reset();
    this.chargeAnimator.reset();
    this.selectedCircuitElementProperty.reset();
  }
}

// @public {Enumeration} - Enumeration for the different types of interaction:
// EXPLORE (used for open-ended exploration)
// TEST (when testing out a black box circuit)
type InteractionMode = 'explore' | 'test';

circuitConstructionKitCommon.register( 'Circuit', Circuit );
export default Circuit;
