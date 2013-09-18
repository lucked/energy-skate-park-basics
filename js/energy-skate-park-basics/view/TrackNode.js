// Copyright 2002-2013, University of Colorado Boulder

/**
 * Scenery node for the track, which can be translated by dragging the track, or manipulated by dragging its control points.
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Path = require( 'SCENERY/nodes/Path' );
  var Circle = require( 'SCENERY/nodes/Circle' );
  var SimpleDragHandler = require( 'SCENERY/input/SimpleDragHandler' );
  var Vector2 = require( 'DOT/Vector2' );
  var Shape = require( 'KITE/Shape' );

  function TrackNode( model, track, modelViewTransform ) {
    var trackNode = this;
    Node.call( this, { renderer: 'svg' } );
    var road = new Path( null, {lineWidth: 10, stroke: 'black', cursor: track.interactive ? 'pointer' : 'default'} );
    this.addChild( road );
    var clickOffset = null;

    var dragHandler = new SimpleDragHandler( {
        allowTouchSnag: true,
        translate: function( options ) {
          var delta = options.delta;
          var modelDelta = modelViewTransform.viewToModelDelta( delta );
          track.translate( modelDelta.x, modelDelta.y );

          //If the user moved it out of the toolbox, then make it physically interactive
          track.physical = true;
        }
      }
    );

    //TODO: KITE currently reports the wrong interaction bounds for the cubic splines.  Why?  Create a scenery ticket.  If necessary, we could build an adapter that uses svg listeners?
    //TODO: Or we could employ a workaround (piecewise segments for example)
    if ( track.interactive ) {
      road.addInputListener( dragHandler );
    }

    //Reuse arrays to save gc
    var x = [];
    var y = [];

    //Store for performance
    //TODO: recompute linSpace if length of track changes
    var lastPt = (track.length - 1) / track.length;

    //made number of sample points depend on the length of the track, to make it smooth enough no matter how long it is
    var linSpace = numeric.linspace( 0, lastPt, 20 * (track.length - 1) );
    var lengthForLinSpace = track.length;

    var updateTrack = function() {

      var i = 0;
      //Update the sample range when the number of control points has changed
      if ( lengthForLinSpace !== track.length ) {
        lastPt = (track.length - 1) / track.length;
        linSpace = numeric.linspace( 0, lastPt, 20 * (track.length - 1) );
        lengthForLinSpace = track.length;
      }

      //clear arrays, reusing them to save on garbage
      x.length = 0;
      y.length = 0;

      for ( i = 0; i < track.length; i++ ) {
        x.push( track.get( i ).value.x );
        y.push( track.get( i ).value.y );
      }

      //Compute points for lineTo
      //TODO: See if there is a way to use the KITE SVG/Canvas curve APIs to render this
      var xPoints = track.xSpline.at( linSpace );
      var yPoints = track.ySpline.at( linSpace );

      var shape = new Shape().
        moveTo( modelViewTransform.modelToViewX( xPoints[0] ), modelViewTransform.modelToViewY( yPoints[0] ) );
      for ( i = 1; i < xPoints.length; i++ ) {
        shape.lineTo( modelViewTransform.modelToViewX( xPoints[i] ), modelViewTransform.modelToViewY( yPoints[i] ) );
      }

      road.shape = shape;
    };

    if ( track.interactive ) {
      for ( var i = 0; i < track.length; i++ ) {
        (function() {
          var property = track.get( i );
          var controlPoint = new Circle( 14, {opacity: 0.7, stroke: 'black', lineWidth: 2, fill: 'red', cursor: 'pointer', translation: modelViewTransform.modelToViewPosition( property.value )} );
          property.link( function( value ) {
            controlPoint.translation = modelViewTransform.modelToViewPosition( value );
          } );
          controlPoint.addInputListener( new SimpleDragHandler(
            {
              allowTouchSnag: true,
              start: function( event ) {
              },
              drag: function( event ) {
                var globalPoint = controlPoint.globalToParentPoint( event.pointer.point );
                property.value = modelViewTransform.viewToModelPosition( globalPoint );

                //If the user moved it out of the toolbox, then make it physically interactive
                track.physical = true;
              },
              translate: function() {

              },
              end: function( event ) {
              }
            } ) );
          trackNode.addChild( controlPoint );
        })();
      }
    }
    //If any control point dragged, update the track
    for ( var index = 0; index < track.length; index++ ) {
      track.get( index ).link( updateTrack );
    }

    track.addItemAddedListener( function( item ) {
      item.link( updateTrack );
      updateTrack();
    } );

    track.addItemRemovedListener( function( item ) {
      item.unlink( updateTrack );
      updateTrack();
    } );
  }

  return inherit( Node, TrackNode );
} );