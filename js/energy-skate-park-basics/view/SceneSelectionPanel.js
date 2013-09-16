//Copyright 2002-2013, University of Colorado

/**
 * Panel with radio buttons for choosing one of three tracks, in the first 2 screens of Energy Skate Park: Basics
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var Panel = require( 'SUN/Panel' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Text = require( 'SCENERY/nodes/Text' );
  var HBox = require( 'SCENERY/nodes/HBox' );
  var PushButton = require( 'SUN/PushButton' );
  var imageLoader = require( 'ENERGY_SKATE_PARK/energy-skate-park-basics-images' );
  var Image = require( 'SCENERY/nodes/Image' );
  var ToggleButton = require( 'SUN/ToggleButton' );
  var Property = require( 'AXON/Property' );
  var TrackNode = require( 'ENERGY_SKATE_PARK/energy-skate-park-basics/view/TrackNode' );
  var BackgroundNode = require( 'ENERGY_SKATE_PARK/energy-skate-park-basics/view/BackgroundNode' );

  function SceneSelectionPanel( model, view, transform ) {

    var createNode = function( name, index ) {

      var track = model.sceneTracks[index];
      var background = new BackgroundNode( model, view );
      background.layout( 0, 0, view.layoutBounds.width, view.layoutBounds.height, 1 );
      var trackNode = new TrackNode( model, track, transform );
      var a = new Node( {children: [background, trackNode ]} );
      a.scale( 38 / a.height );
      var selectedNode = new Panel( a, {stroke: 'black', lineWidth: 3, xMargin: 0, yMargin: 0, cornerRadius: 0} );

      var unselectedNode = new Panel( a, {stroke: 'gray', lineWidth: 0, xMargin: 0, yMargin: 0, cornerRadius: 0, opacity: 0.6} );
      var property = new Property( model.scene === index );

      property.link( function( scene0Selected ) { if ( scene0Selected ) { model.scene = index; } } );
      model.sceneProperty.link( function( scene ) { property.value = scene === index; } );
      return new ToggleButton( selectedNode, unselectedNode, property, {radioButton: true} );
    };

    var content = new HBox( {
      spacing: 10,
      children: [
        createNode( 'Scene 1', 0 ),
        createNode( 'Scene 2', 1 ) ,
        createNode( 'Scene 3', 2 )
      ]} );
    Panel.call( this, content, {xMargin: 10} );
  }

  return inherit( HBox, SceneSelectionPanel );
} );