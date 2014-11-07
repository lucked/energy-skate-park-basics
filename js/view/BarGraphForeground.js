// Copyright 2002-2013, University of Colorado Boulder

/**
 * Scenery node that shows animating bar chart bars as rectangles.  Should be shown in front of the
 * BarGraphBackground.  This was split into separate layers in order to keep the animation fast on iPad.
 *
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var EnergySkateParkColorScheme = require( 'ENERGY_SKATE_PARK_BASICS/view/EnergySkateParkColorScheme' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var Node = require( 'SCENERY/nodes/Node' );

  /**
   * Constructor for the BarGraph
   * @param {Skater} skater the model's skater model
   * @param {Property<Boolean>} barGraphVisibleProperty property that indicates whether the bar graph is visible
   * @param {string} barRenderer the renderer type to use for the bars.  For some reason it is not currently inherited.
   * @constructor
   */
  function BarGraphForeground( skater, barGraphBackground, barGraphVisibleProperty, barRenderer ) {

    var barWidth = barGraphBackground.barWidth;
    var getBarX = barGraphBackground.getBarX;
    var originY = barGraphBackground.originY;

    // Create an energy bar that animates as the skater moves
    var createBar = function( index, color, property ) {

      // Convert to graph coordinates, floor and protect against duplicates
      // However, do not floor for values less than 1 otherwise a nonzero value will show up as zero, see #159
      var barHeightProperty = property.map( function( value ) {
        var result = value / 30;

        return result > 1 ? Math.floor( result ) : result;
      } );
      var barX = getBarX( index );
      var bar = new Rectangle( barX, 0, barWidth, 100, {fill: color, pickable: false, renderer: barRenderer} );

      // update the bars when the graph becomes visible, and skip update when they are invisible
      DerivedProperty.multilink( [barHeightProperty, barGraphVisibleProperty], function( barHeight, visible ) {
        if ( visible ) {
          // PERFORMANCE/ALLOCATION: Possible performance improvement to avoid allocations in Rectangle.setRect

          // If the bar is too small, don't try to render it, see #199
          if ( barHeight < 1E-6 ) {
            barHeight = 0;
          }

          // TODO: just omit negative bars altogether?
          if ( barHeight >= 0 ) {
            bar.setRect( barX, originY - barHeight, barWidth, barHeight );
          }
          else {
            bar.setRect( barX, originY, barWidth, -barHeight );
          }
        }
      } );
      return bar;
    };

    var kineticBar = createBar( 0, EnergySkateParkColorScheme.kineticEnergy, skater.kineticEnergyProperty );
    var potentialBar = createBar( 1, EnergySkateParkColorScheme.potentialEnergy, skater.potentialEnergyProperty );
    var thermalBar = createBar( 2, EnergySkateParkColorScheme.thermalEnergy, skater.thermalEnergyProperty );
    var totalBar = createBar( 3, EnergySkateParkColorScheme.totalEnergy, skater.totalEnergyProperty );

    Node.call( this, {

      // Manually align with the baseline of the bar chart.
      x: 24, y: 15,

      children: [
        kineticBar,
        potentialBar,
        thermalBar,
        totalBar
      ]} );

    // When the bar graph is shown, update the bars (because they do not get updated when invisible for performance reasons)
    barGraphVisibleProperty.linkAttribute( this, 'visible' );
  }

  return inherit( Node, BarGraphForeground );
} );