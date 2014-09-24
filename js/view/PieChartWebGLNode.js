//  Copyright 2002-2014, University of Colorado Boulder

/**
 * Pie chart, rendered in WebGL to improve performance (when WebGL available)
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var Property = require( 'AXON/Property' );
  var PieChartWebGLSliceNode = require( 'ENERGY_SKATE_PARK_BASICS/view/PieChartWebGLSliceNode' );
  var EnergySkateParkColorScheme = require( 'ENERGY_SKATE_PARK_BASICS/view/EnergySkateParkColorScheme' );

  /**
   * @param {Skater} skater the skater model
   * @param {Property<Boolean>} pieChartVisibleProperty axon Property indicating whether the pie chart is shown
   * @param {ModelViewTransform2} modelViewTransform
   * @constructor
   */
  function PieChartWebGLNode( skater, pieChartVisibleProperty, modelViewTransform ) {

    var pieChartNode = this;
    Node.call( this );

    //Show the pie chart above the skater's head
    skater.headPositionProperty.link( function() {
      if ( pieChartNode.visible ) {
        var view = modelViewTransform.modelToViewPosition( skater.headPosition );

        //Center pie chart over skater's head not his feet so it doesn't look awkward when skating in a parabola
        pieChartNode.setTranslation( view.x, view.y - 50 );
      }
    } );

    //Make the radius proportional to the square root of the energy so that the area will grow linearly with energy
    var pieChartRadiusProperty = skater.totalEnergyProperty.map( function( totalEnergy ) {
      return 0.4 * Math.sqrt( totalEnergy );
    } );

    var potentialEnergyProportion = skater.multilink( ['potentialEnergy', 'totalEnergy'], function( potentialEnergy, totalEnergy ) {
      var result = (potentialEnergy / totalEnergy);
      var clamped = result < 0 ? 0 :
                    result > 1 ? 1 :
                    result;
      return clamped * Math.PI * 2;
    } );

    var kineticEnergyProportion = skater.multilink( ['kineticEnergy', 'totalEnergy'], function( kineticEnergy, totalEnergy ) {
      var result = (kineticEnergy / totalEnergy);
      var clamped = result < 0 ? 0 :
                    result > 1 ? 1 :
                    result;
      return clamped * Math.PI * 2;
    } );

    var thermalEnergyProportion = skater.multilink( ['thermalEnergy', 'totalEnergy'], function( thermalEnergy, totalEnergy ) {
      var result = (thermalEnergy / totalEnergy);
      var clamped = result < 0 ? 0 :
                    result > 1 ? 1 :
                    result;
      return clamped * Math.PI * 2;
    } );

    var plus = function( a, b ) {
      return DerivedProperty.multilink( [a, b], function( a, b ) {
        return a + b;
      } );
    };

    var pieStroke = 1;

    //TODO: why did Property.multilink not work here?
    var outlineRadiusProperty = DerivedProperty.multilink( [pieChartRadiusProperty], function( pieChartRadius ) {
      if ( pieChartRadius === 0 ) {
        return 0;
      }
      else {
        return pieChartRadius + pieStroke;
      }
    } );

    //Render the stroke as a larger black circle behind the pie chart
    var outline = new PieChartWebGLSliceNode( skater, 'black', outlineRadiusProperty, new Property( 0 ), new Property( Math.PI * 2 ), pieChartVisibleProperty, modelViewTransform );
    this.addChild( outline );

    var thermalEnergyPiece = new PieChartWebGLSliceNode( skater, EnergySkateParkColorScheme.thermalEnergy, pieChartRadiusProperty, new Property( 0 ), thermalEnergyProportion, pieChartVisibleProperty, modelViewTransform );
    this.addChild( thermalEnergyPiece );

    var kineticEnergyPiece = new PieChartWebGLSliceNode( skater, EnergySkateParkColorScheme.kineticEnergy, pieChartRadiusProperty, thermalEnergyProportion, kineticEnergyProportion, pieChartVisibleProperty, modelViewTransform );
    this.addChild( kineticEnergyPiece );

    var potentialEnergyPiece = new PieChartWebGLSliceNode( skater, EnergySkateParkColorScheme.potentialEnergy, pieChartRadiusProperty, plus( kineticEnergyProportion, thermalEnergyProportion ), potentialEnergyProportion, pieChartVisibleProperty, modelViewTransform );
    this.addChild( potentialEnergyPiece );

  }

  return inherit( Node, PieChartWebGLNode );
} );