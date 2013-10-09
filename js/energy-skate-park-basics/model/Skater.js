// Copyright 2002-2013, University of Colorado Boulder

/**
 * Model for the skater in Energy Skate Park: Basics, including position, velocity, energy, etc..  All units are in meters.
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var PropertySet = require( 'AXON/PropertySet' );
  var Vector2 = require( 'DOT/Vector2' );

  function Skater() {
    var skater = this;

    //TODO: Make it so the skater can go on top or bottom of track
    PropertySet.call( this, {track: null,

      //Parameter along the parametric spline
      u: 0,

      //Speed along the parametric spline dimension, formally 'u dot', indicating speed and direction (+/-) along the track spline
      uD: 0,

      //True if the skater is pointing up on the track, false if attached to underside of track
      up: true,

      //Gravity magnitude and direction
      gravity: -9.8,

      position: new Vector2( 0, 0 ),

      mass: 60,

      velocity: new Vector2( 0, 0 ),

      dragging: false,

      kineticEnergy: 0,

      potentialEnergy: 0,

      thermalEnergy: 0,

      totalEnergy: 0,

      angle: 0,

      //Returns to this point when pressing "return skater"
      startingPosition: new Vector2( 0, 0 ),

      //Returns to this parametric position along the track when pressing "return skater"
      startingU: 0,

      //Returns to this track when pressing "return skater"
      startingTrack: null
    } );

    this.addDerivedProperty( 'speed', ['velocity'], function( velocity ) {return velocity.magnitude();} );
    this.massProperty.link( function( mass ) { skater.updateEnergy(); } );

    this.updateEnergy();
  }

  return inherit( PropertySet, Skater, {
    clearThermal: function() {
      this.thermalEnergy = 0.0;
      this.updateEnergy();
    },

    reset: function() {
      //set the angle to zero before calling PropertySet.prototype.reset so that the optimization for SkaterNode.updatePosition is maintained,
      //Without showing the skater at the wrong angle
      this.angle = 0;
      PropertySet.prototype.reset.call( this );
      this.updateEnergy();
    },

    //Return the skater to the last location it was released by the user (or its starting location)
    //Including the position on a track (if any)
    returnSkater: function() {

      //Have to reset track before changing position so view angle gets updated properly
      if ( this.startingTrack ) {
        this.track = this.startingTrack;
        this.u = this.startingU;
        this.angle = this.startingTrack.getViewAngleAt( this.u );
        this.uD = 0;
      }
      else {
        this.track = null;
      }
      this.positionProperty.set( new Vector2( this.startingPosition.x, this.startingPosition.y ) );
      this.velocity = new Vector2( 0, 0 );
      this.clearThermal();
    },

    //Update the energies as a batch.  This is an explicit method instead of linked to all dependencies so that it can be called in a controlled fashion \
    //When multiple dependencies have changed, for performance.
    updateEnergy: function() {
      this.kineticEnergy = 0.5 * this.mass * this.velocity.magnitudeSquared();
      this.potentialEnergy = -this.mass * this.position.y * this.gravity;
      this.totalEnergy = this.kineticEnergy + this.potentialEnergy + this.thermalEnergy;

      //Signal that energies have changed for coarse-grained listeners like PieChartNode that should not get updated 3-4 times per times step
      this.trigger( 'energy-changed' );
    }
  } );
} );