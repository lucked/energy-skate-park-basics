// Copyright 2002-2013, University of Colorado Boulder

/**
 * Model for the Energy Skate Park: Basics sim, including model values for the view settings, such as whether the grid is visible.
 * All units are in metric.
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var PropertySet = require( 'AXON/PropertySet' );
  var Property = require( 'AXON/Property' );
  var Skater = require( 'ENERGY_SKATE_PARK/energy-skate-park-basics/model/Skater' );
  var Track = require( 'ENERGY_SKATE_PARK/energy-skate-park-basics/model/Track' );
  var ControlPoint = require( 'ENERGY_SKATE_PARK/energy-skate-park-basics/model/ControlPoint' );
  var Vector2 = require( 'DOT/Vector2' );

  /**
   * Main constructor for the EnergySkateParkBasicsModel
   *
   * @param {Boolean} draggableTracks True if this is screen 2-3, where friction is allowed to be on or off
   * @param {Boolean} frictionAllowed True in screen 3 where the user can drag the tracks
   * @constructor
   */
  function EnergySkateParkBasicsModel( draggableTracks, frictionAllowed ) {
    this.frictionAllowed = frictionAllowed;
    this.draggableTracks = draggableTracks;

    var model = this;
    PropertySet.call( this, {
      pieChartVisible: false,
      barGraphVisible: false,
      gridVisible: false,
      speedometerVisible: false,
      paused: false,

      //speed of the model, either 'normal' or 'slow'
      speed: 'normal',

      frictionEnabled: false,
      friction: 1,
      stickToTrack: true
    } );
    this.skater = new Skater();

    if ( !draggableTracks ) {

      //For screens 1-2, the index of the selected scene (and track) within the screen
      this.addProperty( 'scene', 0 );
      var parabola = [new Vector2( -4, 6 ), new Vector2( 0, 0 ), new Vector2( 4, 6 )];
      var slope = [new Vector2( -4, 4 ), new Vector2( -2, 2 ), new Vector2( 2, 1 )];
      var doubleWell = [new Vector2( -4, 5 ), new Vector2( -2, 0 ), new Vector2( 0, 2 ), new Vector2( 2, 1 ), new Vector2( 4, 5 ) ];
      var toControlPoint = function( pt ) {return new ControlPoint( pt.x, pt.y );};
      this.tracks = [new Track( _.map( parabola, toControlPoint ), false ), new Track( _.map( slope, toControlPoint ), false ), new Track( _.map( doubleWell, toControlPoint ), false )];

      this.sceneProperty.link( function( scene ) {
        for ( var i = 0; i < model.tracks.length; i++ ) {
          model.tracks[i].physical = (i === scene);
        }
        model.skater.track = null;
      } );
    }
    else {
      this.tracks = [];
      for ( var i = 0; i < 4; i++ ) {
        //Move the tracks over so they will be in the right position in the view coordinates, under the grass to the left of the clock controls
        //Could use view transform for this, but it would require creating the view first, so just eyeballing it for now.
        var offset = new Vector2( -5, -0.7 );
        var a = new Vector2( -1, 0 ).plus( offset );
        var b = new Vector2( 0, 0 ).plus( offset );
        var c = new Vector2( 1, 0 ).plus( offset );
        var controlPoints = [ new ControlPoint( a.x, a.y ), new ControlPoint( b.x, b.y ), new ControlPoint( c.x, c.y )];
        this.tracks.push( new Track( controlPoints, true ) );
      }
    }

    this.bounces = 0;
  }

  return inherit( PropertySet, EnergySkateParkBasicsModel, {
    reset: function() {
      PropertySet.prototype.reset.call( this );
      this.skater.reset();
      for ( var i = 0; i < this.tracks.length; i++ ) {
        this.tracks[i].reset();
      }

      //For the first two screens, make the default track physical
      if ( !this.draggableTracks ) {
        this.tracks[0].physical = true;
      }
    },

    //See http://digitalcommons.calpoly.edu/cgi/viewcontent.cgi?article=1387&context=phy_fac
    //Computational problems in introductory physics: Lessons from a bead on a wire
    //Thomas J. Bensky and Matthew J. Moelter
    uDD: function( uD, xP, xPP, yP, yPP, g ) {
      return -1 * (uD * uD * (xP * xPP + yP * yPP) - g * yP) / (xP * xP + yP * yP);
    },
    manualStep: function() {
      //step one frame, assuming 60fps
      this.stepModel( 1.0 / 60 );
    },

    //Step the model, automatically called from Joist
    step: function( dt ) {
      //If the delay makes dt too high, then truncate it.  This helps e.g. when clicking in the address bar on ipad, which gives a huge dt and problems for integration
      //TODO: on the iPad3 if all features are turned on, the model will have numerical integration problems and buggy behavior.  We should subdivide dt or find another solution
      //TODO: For subdividing, make sure it is only operating on model instances and not calling view update code, for performance.  This could be done best by computing a hash of deltas to apply to the model.
      if ( dt > 1.0 / 10 ) {
        dt = 1.0 / 10;
      }
      if ( !this.paused ) {

        this.stepModel( this.speed === 'normal' ? dt : dt * 0.25 );
      }
    },
    stepGround: function( dt ) { },

    //Update the skater in free fall
    stepFreeFall: function( dt ) {
      var skater = this.skater;
      var initialEnergy = skater.totalEnergy;
      var netForce = new Vector2( 0, -9.8 * skater.mass );

      var acceleration = netForce.times( 1.0 / skater.mass );
      var proposedVelocity = skater.velocity.plus( acceleration.times( dt ) );
      var proposedPosition = skater.position.plus( proposedVelocity.times( dt ) );
      if ( proposedPosition.y < 0 ) {
        proposedPosition.y = 0;
      }
      if ( skater.position.x !== proposedPosition.x || skater.position.y !== proposedPosition.y ) {

        //see if it crossed the track
        var physicalTracks = this.getPhysicalTracks();
        if ( physicalTracks.length ) {
          this.interactWithTracksWhileFalling( physicalTracks, skater, proposedPosition, initialEnergy, dt, proposedVelocity );
        }
        else {
          this.continueFreeFall( skater, initialEnergy, proposedPosition, proposedVelocity );
        }
      }
    },

    //Find the closest track to the skater, to see what he can bounce off of or attach to, and return the closest point on that track took
    getClosestTrackAndPositionAndParameter: function( position, physicalTracks ) {
      var closestTrack = null;
      var closestDistance = null;
      var closestMatch = null;
      for ( var i = 0; i < physicalTracks.length; i++ ) {
        var track = physicalTracks[i];

        //TODO: maybe get closest point shouldn't return a new object allocation each time, or use pooling for it, or pass in reference as an arg?
        var bestMatch = track.getClosestPositionAndParameter( position );
        if ( closestDistance === null || bestMatch.distance < closestDistance ) {
          closestDistance = bestMatch.distance;
          closestTrack = track;
          closestMatch = bestMatch;
        }
      }
      if ( closestTrack ) {
        return {track: closestTrack, u: closestMatch.u, point: closestMatch.point};
      }
      else {
        return null;
      }
    },

    //Check to see if it should hit or attach to track during free fall
    interactWithTracksWhileFalling: function( physicalTracks, skater, proposedPosition, initialEnergy, dt, proposedVelocity ) {

      //Find the closest track
      var closestTrackAndPositionAndParameter = this.getClosestTrackAndPositionAndParameter( skater.position, physicalTracks );
      var track = closestTrackAndPositionAndParameter.track;
      var u = closestTrackAndPositionAndParameter.u;

      if ( !track.isParameterInBounds( u ) ) {
        this.continueFreeFall( skater, initialEnergy, proposedPosition, proposedVelocity );
        return;
      }
      var t1 = u - 1E-6;
      var t2 = u + 1E-6;
      var pt = closestTrackAndPositionAndParameter.point;
      var pt1 = track.getPoint( t1 );
      var pt2 = track.getPoint( t2 );
      var segment = pt2.minus( pt1 ).normalized();
      var normal = segment.rotated( Math.PI / 2 );

      var beforeSign = normal.dot( skater.position.minus( pt ) ) > 0;
      var afterSign = normal.dot( proposedPosition.minus( pt ) ) > 0;
//          console.log( normal.dot( skater.position ), normal.dot( proposedPosition ), beforeSign, afterSign );
      if ( beforeSign !== afterSign ) {

        //reflect the velocity vector
        //http://www.gamedev.net/topic/165537-2d-vector-reflection-/
        var allOK = proposedVelocity && proposedVelocity.minus && normal.times && normal.dot;
//        if ( !allOK ) { alert( 'allOK === false' ); }
        var bounceVelocity = allOK ? proposedVelocity.minus( normal.times( 2 * normal.dot( proposedVelocity ) ) ) :
                             new Vector2( 0, 1 );

        //Attach to track if velocity is close enough to parallel to the track
        var dot = Math.abs( proposedVelocity.normalized().dot( segment ) );

        //If friction is allowed, then bounce with elasticity <1.
        //If friction is not allowed, then bounce with elasticity = 1.
        if ( dot < 0.4 ) {
          skater.velocity = bounceVelocity;
          this.bounces++;
        }
        else {
          //If friction is allowed, keep the parallel component of velocity.
          //If friction is not allowed, then either attach to the track with no change in speed

          //Estimate u dot from equations (8) & (9) in the paper
          var uDx = proposedVelocity.x / track.xSplineDiff.at( u );
          var uDy = proposedVelocity.y / track.ySplineDiff.at( u );
          var uD = (uDx + uDy) / 2;

          //update skater variables
          skater.track = track;
          skater.u = u;
          skater.uD = uD;

          //TODO: Refine uD estimate based on energy conservation

          var newEnergy = track.getEnergy( u, skater.uD, skater.mass, skater.gravity );
          var delta = newEnergy - initialEnergy;
          if ( delta < 0 ) {
            var lostEnergy = Math.abs( delta );
            skater.thermalEnergy = skater.thermalEnergy + lostEnergy;
          }

          this.stepTrack( dt );
        }
      }

      //It just continued in free fall
      else {
        this.continueFreeFall( skater, initialEnergy, proposedPosition, proposedVelocity );
      }
    },

    //Started in free fall and did not interact with a track
    //TODO: handle the case where the skater is moving to the left/right when landing on the ground
    continueFreeFall: function( skater, initialEnergy, proposedPosition, proposedVelocity ) {

      //make up for the difference by changing the y value
      var y = (initialEnergy - 0.5 * skater.mass * proposedVelocity.magnitudeSquared() - skater.thermalEnergy) / (-1 * skater.mass * skater.gravity);
      if ( y < 0 ) {

        //When falling straight down, stop completely and convert all energy to thermal
        skater.velocity = new Vector2( 0, 0 );
        skater.thermalEnergy = initialEnergy;
        skater.angle = 0;
      }
      else {

        //TODO: keep track of all of the variables in a hash so they can be set at once after verification and after energy conserved, which will also help with dt subdivisions
        skater.position = new Vector2( proposedPosition.x, y );
        skater.velocity = proposedVelocity;
      }
      skater.updateEnergy();
    },

    //Update the skater if he is on the track
    //TODO: Add support for friction
    stepTrack: function( dt ) {
      var skater = this.skater;
      var track = skater.track;
      var u = skater.u;
      var uD = skater.uD;

      //Factor out constants for inner loops
      var mass = skater.mass;
      var gravity = skater.gravity;

      var xP = track.xSplineDiff.at( u );
      var yP = track.ySplineDiff.at( u );
      var xPP = track.xSplineDiffDiff.at( u );
      var yPP = track.ySplineDiffDiff.at( u );
      var uDD1 = this.uDD( uD, xP, xPP, yP, yPP, gravity );

      var uD2 = uD + uDD1 * dt;
      var u2 = u + (uD + uD2) / 2 * dt; //averaging here really keeps down the average error.  It's not exactly forward Euler but I forget the name.

      var x = track.getX( u2 );
      var y = track.getY( u2 );
      var initialEnergy = track.getEnergy( u, uD, mass, gravity );
      var finalEnergy = track.getEnergy( u2, uD2, mass, gravity );

      //TODO: use a more accurate numerical integration scheme.  Currently forward Euler

      var count = 0;
      var upperBound = uD2 * 1.2;
      var lowerBound = uD2 * 0.8;

      //Binary search on the parametric velocity to make sure energy is exactly conserved
//        console.log( 'START BINARY' );
//        console.log( (finalEnergy - initialEnergy).toFixed( 2 ), initialEnergy, finalEnergy );

      var xPrime2 = track.xSplineDiff.at( u2 );
      var yPrime2 = track.ySplineDiff.at( u2 );
      var gravEnergy = -mass * gravity * y;
      var factoredEnergy = 1 / 2 * mass * (xPrime2 * xPrime2 + yPrime2 * yPrime2);
      while ( Math.abs( finalEnergy - initialEnergy ) > 1E-2 ) {
//          console.log( (finalEnergy - initialEnergy).toFixed( 2 ), 'binary search, lowerBound=', lowerBound, 'upperBound', upperBound );
        var uMid = (upperBound + lowerBound) / 2;

        //TODO: if we need to tweak u as well as uD then we may need to use track.getEnergy and forego some optimizations
        var midEnergy = gravEnergy + factoredEnergy * uMid * uMid;
        if ( midEnergy > initialEnergy ) {
          upperBound = uMid;
        }
        else {
          lowerBound = uMid;
        }
        finalEnergy = midEnergy;
        count++;
        if ( count >= 1000 ) {
          console.log( 'count', count );
          break;
        }
      }
      uD2 = (upperBound + lowerBound) / 2;
//        console.log( (finalEnergy - initialEnergy).toFixed( 2 ), initialEnergy, finalEnergy );
//        console.log( "END BINARY, count=", count );

      skater.uD = uD2;
      skater.u = u2;

      var vx = xPrime2 * uD2;
      var vy = yPrime2 * uD2;

      skater.velocity = new Vector2( vx, vy );
      skater.angle = skater.track.getViewAngleAt( skater.u );
      skater.position = new Vector2( x, y );
      skater.updateEnergy();

      //Fly off the left or right side of the track
      if ( !skater.track.isParameterInBounds( u2 ) ) {
        skater.track = null;
        skater.uD = 0;
      }
    },
    stepModel: function( dt ) {
      var skater = this.skater;

      //Free fall
      if ( !skater.dragging && !skater.track && skater.position.y > 0 ) {
        this.stepFreeFall( dt );
      }
      else if ( !skater.dragging && !skater.track && skater.position.y <= 0 ) {
        this.stepGround( dt );
      }
      else if ( !skater.dragging && skater.track ) {
        this.stepTrack( dt );
      }
    },

    //Return to the place he was last released by the user
    returnSkater: function() { this.skater.returnSkater(); },

    //Clear the thermal energy from the model
    clearThermal: function() { this.skater.clearThermal(); },

    //Get all of the tracks marked as physical (i.e. that the skater could interact with).
    getPhysicalTracks: function() {

      //Use vanilla instead of lodash for speed since this is in an inner loop
      var physicalTracks = [];
      for ( var i = 0; i < this.tracks.length; i++ ) {
        var track = this.tracks[i];

        if ( track.physical ) {
          physicalTracks.push( track );
        }
      }
      return physicalTracks;
    }
  } );
} );