// Copyright 2013-2015, University of Colorado Boulder

/**
 * Scenery node for the control panel, with view settings and controls.
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var energySkateParkBasics = require( 'ENERGY_SKATE_PARK_BASICS/energySkateParkBasics' );
  var inherit = require( 'PHET_CORE/inherit' );
  var TandemNode = require( 'TANDEM/scenery/nodes/TandemNode' );
  var VBox = require( 'SCENERY/nodes/VBox' );
  var HBox = require( 'SCENERY/nodes/HBox' );
  var TandemPath = require( 'TANDEM/scenery/nodes/TandemPath' );
  var Shape = require( 'KITE/Shape' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Line = require( 'SCENERY/nodes/Line' );
  var Circle = require( 'SCENERY/nodes/Circle' );
  var Panel = require( 'SUN/Panel' );
  var CheckBox = require( 'SUN/CheckBox' );
  var TandemText = require( 'TANDEM/scenery/nodes/TandemText' );
  var MassControlPanel = require( 'ENERGY_SKATE_PARK_BASICS/energy-skate-park-basics/view/MassControlPanel' );
  var EnergySkateParkColorScheme = require( 'ENERGY_SKATE_PARK_BASICS/energy-skate-park-basics/view/EnergySkateParkColorScheme' );
  var GaugeNode = require( 'SCENERY_PHET/GaugeNode' );
  var Property = require( 'AXON/Property' );
  var FrictionControl = require( 'ENERGY_SKATE_PARK_BASICS/energy-skate-park-basics/view/FrictionControl' );
  var PhetFont = require( 'SCENERY_PHET/PhetFont' );

  // strings
  var plotsBarGraphString = require( 'string!ENERGY_SKATE_PARK_BASICS/plots.bar-graph' );
  var pieChartString = require( 'string!ENERGY_SKATE_PARK_BASICS/pieChart' );
  var propertiesSpeedString = require( 'string!ENERGY_SKATE_PARK_BASICS/properties.speed' );
  var controlsShowGridString = require( 'string!ENERGY_SKATE_PARK_BASICS/controls.show-grid' );

  /**
   * @param {EnergySkateParkBasicsModel} model
   * @param {Tandem} tandem
   * @constructor
   */
  function EnergySkateParkBasicsControlPanel( model, tandem ) {
    var textOptions = {
      font: new PhetFont( 14 ),
      maxWidth: 134 // selected by choosing the length of widest English string in ?stringTest=double
    };
    var pieChartSet = {
      label: new TandemText( pieChartString, _.extend( { tandem: tandem.createTandem( 'pieChartLabel' ) }, textOptions ) ),
      icon: this.createPieChartIcon( tandem.createTandem( 'pieChartIcon' ) )
    };
    var barGraphSet = {
      label: new TandemText( plotsBarGraphString, _.extend( { tandem: tandem.createTandem( 'barGraphLabel' ) }, textOptions ) ),
      icon: this.createBarGraphIcon( tandem.createTandem( 'barGraphIcon' ) )
    };
    var gridSet = {
      label: new TandemText( controlsShowGridString, _.extend( { tandem: tandem.createTandem( 'gridLabel' ) }, textOptions ) ),
      icon: this.createGridIcon( tandem.createTandem( 'gridIcon' ) )
    };
    var speedometerSet = {
      label: new TandemText( propertiesSpeedString, _.extend( { tandem: tandem.createTandem( 'speedometerLabel' ) }, textOptions ) ),
      icon: this.createSpeedometerIcon( tandem.createTandem( 'speedometerIcon' ) )
    };

    var sets = [ pieChartSet, barGraphSet, gridSet, speedometerSet ];
    var maxTextWidth = _.max( sets, function( itemSet ) { return itemSet.label.width; } ).label.width;

    // In the absence of any sun (or other) layout packages, just manually space them out so they will have the icons aligned
    var pad = function( itemSet ) {
      var padWidth = maxTextWidth - itemSet.label.width;
      return [ itemSet.label, new Rectangle( 0, 0, padWidth + 20, 20 ), itemSet.icon ];
    };

    var checkBoxItemOptions = { boxWidth: 18 };

    var checkBoxChildren = [
      new CheckBox(
        new HBox( { children: pad( pieChartSet ) } ),
        model.property( 'pieChartVisible' ),
        _.extend( { tandem: tandem.createTandem( 'pieChartCheckBox' ) }, checkBoxItemOptions )
      ),
      new CheckBox(
        new HBox( { children: pad( barGraphSet ) } ),
        model.property( 'barGraphVisible' ),
        _.extend( { tandem: tandem.createTandem( 'barGraphCheckBox' ) }, checkBoxItemOptions ) ),
      new CheckBox(
        new HBox( { children: pad( gridSet ) } ),
        model.property( 'gridVisible' ),
        _.extend( { tandem: tandem.createTandem( 'gridCheckBox' ) }, checkBoxItemOptions ) ),
      new CheckBox(
        new HBox( { children: pad( speedometerSet ) } ),
        model.property( 'speedometerVisible' ),
        _.extend( { tandem: tandem.createTandem( 'speedometerCheckBox' ) }, checkBoxItemOptions )
      ) ];
    var checkBoxes = new VBox( { align: 'left', spacing: 10, children: checkBoxChildren } );

    var massControlPanel = new MassControlPanel( model.skater.massProperty, tandem.createTandem( 'massControlPanel' ) );

    // For 1st screen, show MassControlPanel
    // For 2nd and 3rd screen, show Friction Slider and Mass Slider, see #147
    var children = [ checkBoxes, massControlPanel ];
    if ( model.frictionAllowed ) {
      children.push( new FrictionControl( model.property( 'friction' ), tandem.createTandem( 'frictionSlider' ) ) );
    }
    var content = new VBox( { resize: false, spacing: 6, children: children } );

    this.contentWidth = content.width;
    Panel.call( this, content, { xMargin: 10, yMargin: 5, fill: '#F0F0F0', stroke: null, resize: false } );
  }

  energySkateParkBasics.register( 'EnergySkateParkBasicsControlPanel', EnergySkateParkBasicsControlPanel );

  return inherit( Panel, EnergySkateParkBasicsControlPanel, {

    // Create an icon for the bar graph check box
    createBarGraphIcon: function( tandem ) {
      return new TandemNode( {
        tandem: tandem,
        children: [
          new Rectangle( 0, 0, 20, 20, { fill: 'white', stroke: 'black', lineWidth: 0.5 } ),
          new Rectangle( 3, 14, 5, 6, {
            fill: EnergySkateParkColorScheme.kineticEnergy,
            stroke: 'black',
            lineWidth: 0.5
          } ),
          new Rectangle( 11, 8, 5, 12, {
            fill: EnergySkateParkColorScheme.potentialEnergy,
            stroke: 'black',
            lineWidth: 0.5
          } )
        ]
      } );
    },

    // Create an icon for the pie chart check box
    createPieChartIcon: function( tandem ) {
      var radius = 10;
      var x = new Shape().moveTo( 0, 0 ).ellipticalArc( 0, 0, radius, radius, 0, -Math.PI / 2, 0, false ).lineTo( 0, 0 );
      return new TandemNode( {
        tandem: tandem,
        children: [
          new Circle( radius, { fill: EnergySkateParkColorScheme.potentialEnergy, lineWidth: 0.5, stroke: 'black' } ),
          new TandemPath( x, {
            tandem: tandem.createTandem( 'path' ), // TODO: What is this path for
            fill: EnergySkateParkColorScheme.kineticEnergy, lineWidth: 0.5, stroke: 'black'
          } )
        ]
      } );
    },

    // Create an icon for the grid check box
    createGridIcon: function( tandem ) {
      return new TandemNode( {
        tandem: tandem,
        children: [
          new Rectangle( 0, 0, 20, 20, { fill: 'white', stroke: 'black', lineWidth: 0.5 } ),
          new Line( 0, 10, 20, 10, { stroke: 'black', lineWidth: 1 } ),
          new Line( 0, 5, 20, 5, { stroke: 'black', lineWidth: 0.5 } ),
          new Line( 0, 15, 20, 15, { stroke: 'black', lineWidth: 0.5 } ),
          new Line( 10, 0, 10, 20, { stroke: 'black', lineWidth: 1 } ),
          new Line( 5, 0, 5, 20, { stroke: 'black', lineWidth: 0.5 } ),
          new Line( 15, 0, 15, 20, { stroke: 'black', lineWidth: 0.5 } )
        ]
      } );
    },

    // Create an icon for the speedometer check box
    createSpeedometerIcon: function() {
      var node = new GaugeNode( new Property( 0 ), propertiesSpeedString, { min: 0, max: 10 }, { pickable: false } );
      node.scale( 20 / node.width );
      return node;
    }
  } );
} );