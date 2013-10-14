// Copyright 2002-2013, University of Colorado Boulder

/**
 * Scenery node for the energy skate park basics view (includes everything you see)
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Rect = require( 'DOT/Rectangle' );
  var Shape = require( 'KITE/Shape' );
  var Panel = require( 'SUN/Panel' );
  var ScreenView = require( 'JOIST/ScreenView' );
  var SkaterNode = require( 'ENERGY_SKATE_PARK_BASICS/view/SkaterNode' );
  var TrackNode = require( 'ENERGY_SKATE_PARK_BASICS/view/TrackNode' );
  var BackgroundNode = require( 'ENERGY_SKATE_PARK_BASICS/view/BackgroundNode' );
  var EnergySkateParkBasicsControlPanel = require( 'ENERGY_SKATE_PARK_BASICS/view/EnergySkateParkBasicsControlPanel' );
  var PlayPauseControlPanel = require( 'ENERGY_SKATE_PARK_BASICS/view/PlayPauseControlPanel' );
  var PlaybackSpeedControl = require( 'ENERGY_SKATE_PARK_BASICS/view/PlaybackSpeedControl' );
  var BarGraphNode = require( 'ENERGY_SKATE_PARK_BASICS/view/BarGraphNode' );
  var PieChartNode = require( 'ENERGY_SKATE_PARK_BASICS/view/PieChartNode' );
  var PieChartLegend = require( 'ENERGY_SKATE_PARK_BASICS/view/PieChartLegend' );
  var GridNode = require( 'ENERGY_SKATE_PARK_BASICS/view/GridNode' );
  var CircularRegressionNode = require( 'ENERGY_SKATE_PARK_BASICS/view/CircularRegressionNode' );
  var ResetAllButton = require( 'SCENERY_PHET/ResetAllButton' );
  var SceneSelectionPanel = require( 'ENERGY_SKATE_PARK_BASICS/view/SceneSelectionPanel' );
  var ModelViewTransform2 = require( 'PHETCOMMON/view/ModelViewTransform2' );
  var Vector2 = require( 'DOT/Vector2' );
  var SpeedometerNode = require( 'SCENERY_PHET/SpeedometerNode' );
  var TextButton = require( 'SUN/TextButton' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var Path = require( 'SCENERY/nodes/Path' );
  var returnSkaterString = require( 'string!ENERGY_SKATE_PARK_BASICS/controls.reset-character' );
  var speedString = require( 'string!ENERGY_SKATE_PARK_BASICS/properties.speed' );

  //Debug flag to show the view bounds, the region within which the skater can move
  var showAvailableBounds = false;

  //TODO: Consider floating panels to the side when space is available.  For instance, the control panel could float to the right if there is extra space there on a wide screen
  //TODO: (but don't float arbitrarily far because it could get too far from the play area).
  function EnergySkateParkBasicsView( model ) {

    var view = this;
    ScreenView.call( view, { renderer: 'svg' } );

    var modelPoint = new Vector2( 0, 0 );
    var viewPoint = new Vector2( this.layoutBounds.width / 2, this.layoutBounds.height - BackgroundNode.grassHeight );//grass is 70px high in stage coordinates
    var scale = 50;
    var transform = ModelViewTransform2.createSinglePointScaleInvertedYMapping( modelPoint, viewPoint, scale );
    this.modelViewTransform = transform;

    //The background
    this.backgroundNode = new BackgroundNode( model, this );
    this.addChild( this.backgroundNode );

    this.gridNode = new GridNode( model, this, transform );
    this.addChild( this.gridNode );

    //Switch between selectable tracks
    if ( !model.draggableTracks ) {

      var trackNodes = model.tracks.map(function( track ) { return new TrackNode( model, track, transform ); } ).getArray();
      trackNodes.forEach( function( trackNode ) {
        view.addChild( trackNode );
      } );

      model.sceneProperty.link( function( scene ) {
        trackNodes[0].visible = (scene === 0);
        trackNodes[1].visible = (scene === 1);
        trackNodes[2].visible = (scene === 2);
      } );
    }
    else {

      var addTrackNode = function( track ) {

        var trackNode = new TrackNode( model, track, transform, function( point ) {
          var globalBounds = view.trackCreationPanel.parentToGlobalBounds( view.trackCreationPanel.bounds );
          return globalBounds.containsPoint( point );
        } );
        view.addChild( trackNode );

        //When track removed, remove its view
        var itemRemovedListener = function( removed ) {
          if ( removed === track ) {
            view.removeChild( trackNode );
            model.tracks.removeItemRemovedListener( itemRemovedListener );//Clean up memory leak
          }
        };
        model.tracks.addItemRemovedListener( itemRemovedListener );

        return trackNode;
      };

      //Create the tracks for the track toolbox
      var interactiveTrackNodes = model.tracks.map( addTrackNode ).getArray();

      //Add a panel behind the tracks
      var margin = 5;
      this.trackCreationPanel = new Panel( new Rectangle( 0, 0, interactiveTrackNodes[0].width, interactiveTrackNodes[0].height ), {xMargin: margin, yMargin: margin, x: interactiveTrackNodes[0].left - margin, y: interactiveTrackNodes[0].top - margin} );
      this.addChild( this.trackCreationPanel );

      interactiveTrackNodes.forEach( function( trackNode ) { trackNode.moveToFront(); } );

      model.tracks.addItemAddedListener( addTrackNode );
    }

    var skaterNode = new SkaterNode( model, this, transform );
    this.addChild( skaterNode );
    this.addChild( new PieChartNode( model, this, transform ) );
    var pieChartLegend = new PieChartLegend( model );
    this.addChild( pieChartLegend );

    var speedometerNode = new SpeedometerNode( model.skater.speedProperty, speedString, 20 );
    model.speedometerVisibleProperty.linkAttribute( speedometerNode, 'visible' );
    speedometerNode.centerX = this.layoutBounds.centerX;
    speedometerNode.top = this.layoutBounds.minY + 5;
    this.addChild( speedometerNode );

    this.controlPanel = new EnergySkateParkBasicsControlPanel( model, this );
    this.addChild( this.controlPanel );
    this.controlPanel.right = this.layoutBounds.width - 5;
    this.controlPanel.top = 5;

    //center the pie chart legend between the control panel and speedometer
    pieChartLegend.mutate( {top: this.controlPanel.top, right: this.controlPanel.left - 9} );

    //The button to return the skater
    //TODO: Disable this button when the skater is already at his initial coordinates?
    var returnSkaterButton = new TextButton( returnSkaterString, model.returnSkater.bind( model ), {centerX: this.controlPanel.centerX, top: this.controlPanel.bottom + 10} );
    this.addChild( returnSkaterButton );

    //Determine if the skater is onscreen or offscreen for purposes of highlighting the 'return skater' button.
    var onscreenProperty = new DerivedProperty( [model.skater.positionProperty], function( position ) {
      return view.availableModelBounds && view.availableModelBounds.containsPoint( position );
    } );

    //When the skater goes off screen, make the "return skater" button big
    onscreenProperty.lazyLink( function( onscreen ) {
      var center = returnSkaterButton.center;
      console.log( 'onscreen', onscreen );
      returnSkaterButton.setScaleMagnitude( onscreen ? 1 : 1.5 );
      returnSkaterButton.center = center;
    } );

    this.addChild( new BarGraphNode( model, this ) );

    var playPauseControl = new PlayPauseControlPanel( model, this );
    this.addChild( playPauseControl.mutate( {centerX: this.layoutBounds.centerX + playPauseControl.playButton.width / 2, bottom: this.layoutBounds.maxY - 10} ) );

    this.addChild( new ResetAllButton( model.reset.bind( model ) ).mutate( {scale: 0.7, centerY: (transform.modelToViewY( 0 ) + this.layoutBounds.maxY) / 2, centerX: this.controlPanel.centerX} ) );

    this.addChild( new PlaybackSpeedControl( model ).mutate( {right: playPauseControl.left, centerY: playPauseControl.centerY} ) );

    if ( !model.draggableTracks ) {
      this.addChild( new SceneSelectionPanel( model, this, transform ).mutate( {left: 0, centerY: playPauseControl.centerY} ) );
    }

    //For debugging the visible bounds
    if ( showAvailableBounds ) {
      this.viewBoundsPath = new Path( null, {pickable: false, stroke: 'red', lineWidth: 10} );
      this.addChild( this.viewBoundsPath );
    }

    //For debugging the circular regression computation
    if ( model.showCircularRegression ) {
      this.addChild( new CircularRegressionNode( model.circularRegressionProperty, transform ) );
    }
  }

  return inherit( ScreenView, EnergySkateParkBasicsView, {

    //Layout the EnergySkateParkBasicsView, scaling it up and down with the size of the screen to ensure a minimially visible area,
    //But keeping it centered at the bottom of the screen, so there is more area in the +y direction to build tracks and move the skater
    //TODO: integrate this layout code with ScreenView?  Seems like it could be generally useful
    layout: function( width, height ) {

      this.resetTransform();

      var scale = this.getLayoutScale( width, height );
      this.setScaleMagnitude( scale );

      var offsetX = 0;
      var offsetY = 0;

      //Move to bottom vertically
      if ( scale === width / this.layoutBounds.width ) {
        offsetY = (height / scale - this.layoutBounds.height);
      }

      //center horizontally
      else if ( scale === height / this.layoutBounds.height ) {
        offsetX = (width - this.layoutBounds.width * scale) / 2 / scale;
      }
      this.translate( offsetX, offsetY );

      this.backgroundNode.layout( offsetX, offsetY, width, height, scale );
      this.gridNode.layout( offsetX, offsetY, width, height, scale );

      this.availableViewBounds = new Rect( -offsetX, -offsetY, width / scale, this.modelViewTransform.modelToViewY( 0 ) + Math.abs( offsetY ) );

      //Compute the visible model bounds so we will know when a model object like the skater has gone offscreen
      this.availableModelBounds = this.modelViewTransform.viewToModelBounds( this.availableViewBounds );

      //Show it for debugging
      if ( showAvailableBounds ) {
//        this.viewBoundsPath.shape = Shape.bounds( this.modelViewTransform.modelToViewBounds( this.availableModelBounds ) );
        this.viewBoundsPath.shape = Shape.bounds( this.availableViewBounds );
      }
    }
  } );
} );