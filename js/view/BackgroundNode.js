// Copyright 2002-2013, University of Colorado Boulder

/**
 * Scenery node that shows the background, including the mountains, sky, ground and grass.
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Line = require( 'SCENERY/nodes/Line' );
  var Path = require( 'SCENERY/nodes/Path' );
  var Image = require( 'SCENERY/nodes/Image' );
  var LinearGradient = require( 'SCENERY/util/LinearGradient' );
  var mountainImage = require( 'image!ENERGY_SKATE_PARK_BASICS/mountains.png' );
  var cementImg = require( 'image!ENERGY_SKATE_PARK_BASICS/cement-texture-dark.jpg' );
  var Pattern = require( 'SCENERY/util/Pattern' );
  var Shape = require( 'KITE/Shape' );

  var earthHeight = 70;
  var cementWidth = 4;

  function BackgroundNode( model, energySkateParkBasicsView ) {
    this.skater = model.skater;
    Node.call( this, { pickable: false } );

    this.sky = new Rectangle( 0, 0, 0, 0 );
    this.addChild( this.sky );

    //Wait for bounds to fill in the grass
    this.earth = new Rectangle( 0, 0, 0, 0, {fill: '#93774c'} );
    this.addChild( this.earth );

    this.cementY = energySkateParkBasicsView.layoutBounds.height - earthHeight;

    this.mountain = new Image( mountainImage, {bottom: this.cementY} );
    this.addChild( this.mountain );

    this.cement = new Line( 0, 0, 0, 0, {stroke: new Pattern( cementImg ), lineWidth: cementWidth} );
    this.addChild( this.cement );
  }

  return inherit( Node, BackgroundNode, {

      //Exactly fit the geometry to the screen so no matter what aspect ratio it will always show something.  Perhaps it will improve performance too?
      layout: function( offsetX, offsetY, width, height, layoutScale ) {
        var cementY = this.cementY;
        this.earth.setRect( -offsetX, cementY, width / layoutScale, earthHeight );
        this.cement.setLine( -offsetX, cementY + cementWidth / 2, -offsetX + width / layoutScale, cementY + cementWidth / 2 );
        this.sky.setRect( -offsetX, -offsetY, width / layoutScale, height / layoutScale - earthHeight );
        this.sky.fill = new LinearGradient( 0, 0, 0, height / 2 ).addColorStop( 0, '#02ace4' ).addColorStop( 1, '#cfecfc' );
      }
    },

    //Statics
    {
      earthHeight: earthHeight
    } );
} );