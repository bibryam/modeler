import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

import './style.css';

import $ from 'jquery';

import BpmnModeler from 'bpmn-js/lib/Modeler';

import diagramXML from '../resources/newDiagram.bpmn';

// Import the custom palette provider directly
import CustomPaletteProvider from './customPalette';

var container = $('#js-drop-zone');

var modeler = new BpmnModeler({
  container: '#js-canvas',
  // Register the custom module with specific configuration to fully replace the palette
  additionalModules: [
    {
      __init__: ['paletteProvider'],
      paletteProvider: ['type', CustomPaletteProvider]
    }
  ]
});

function createNewDiagram() {
  openDiagram(diagramXML);
}

async function openDiagram(xml) {

  try {

    await modeler.importXML(xml);

    container
      .removeClass('with-error')
      .addClass('with-diagram');
      
    // Trigger export artifacts after diagram is loaded
    if (typeof exportArtifactsFunc === 'function') {
      exportArtifactsFunc();
    }
  } catch (err) {

    container
      .removeClass('with-diagram')
      .addClass('with-error');

    container.find('.error pre').text(err.message);

    console.error(err);
  }
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}

// Handle file input for upload button
function handleFileSelect(inputElement, callback) {
  if (!inputElement.files.length) {
    return;
  }

  var file = inputElement.files[0];
  
  var reader = new FileReader();
  
  reader.onload = function(e) {
    var xml = e.target.result;
    callback(xml);
  };
  
  reader.readAsText(file);
}

// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions

$(function() {
  var downloadLink = $('#js-download-diagram');
  var downloadPngLink = $('#js-download-png');
  var copyPngLink = $('#js-copy-png');
  var uploadButton = $('#js-upload-diagram');
  
  // Make upload button always active
  uploadButton.addClass('active');
  
  // Create new diagram handler
  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    createNewDiagram();
  });
  
  // Set up file input for the upload button
  uploadButton.click(function(e) {
    e.preventDefault();
    
    // Create and click a hidden file input
    var fileInput = $('<input type="file" accept=".bpmn, .xml" style="display: none;">');
    $('body').append(fileInput);
    
    fileInput.on('change', function() {
      handleFileSelect(this, openDiagram);
      fileInput.remove();
    });
    
    fileInput.trigger('click');
  });
  
  // Store the current PNG data URL
  var currentPngData = null;

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  function setEncodedPng(link, name, data) {
    if (data) {
      link.addClass('active').attr({
        'href': data,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  // Function to copy PNG to clipboard
  async function copyPngToClipboard() {
    if (!currentPngData) {
      console.error('No PNG data available to copy');
      return;
    }

    try {
      // Fetch the image as a blob
      const response = await fetch(currentPngData);
      const blob = await response.blob();
      
      // Create a ClipboardItem with the blob
      const item = new ClipboardItem({ 'image/png': blob });
      
      // Write to clipboard
      await navigator.clipboard.write([item]);
      
      // Visual feedback
      const originalText = copyPngLink.text();
      copyPngLink.text('Copied!');
      
      // Reset text after a delay
      setTimeout(() => {
        copyPngLink.text(originalText);
      }, 2000);
      
    } catch (err) {
      console.error('Error copying PNG to clipboard:', err);
      alert('Failed to copy image to clipboard. Your browser may not support this feature.');
    }
  }

  // Setup click handler for PNG copy button
  copyPngLink.click(function(e) {
    e.preventDefault();
    e.stopPropagation();
    copyPngToClipboard();
  });

  // Convert SVG to PNG using Canvas
  function convertSvgToPng(svgData, callback) {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create an image to draw on canvas
      const img = new Image();
      
      // Set up image onload handler
      img.onload = function() {
        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw white background (SVG may have transparent background)
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image on the canvas
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to PNG data URL
        const pngData = canvas.toDataURL('image/png');
        callback(pngData);
      };
      
      // Handle errors
      img.onerror = function() {
        console.error('Error loading SVG for PNG conversion');
        callback(null);
      };
      
      // Set image source as SVG data URL
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Error converting SVG to PNG:', err);
      callback(null);
    }
  }

  var exportArtifacts = debounce(async function() {
    try {
      const { svg } = await modeler.saveSVG();
      
      // Convert SVG to PNG and set PNG link
      convertSvgToPng(svg, function(pngData) {
        // Store PNG data for clipboard operations
        currentPngData = pngData;
        
        // Update download link
        setEncodedPng(downloadPngLink, 'diagram.png', pngData);
        
        // Enable copy button
        copyPngLink.addClass('active');
      });
    } catch (err) {
      console.error('Error happened saving SVG/PNG: ', err);
      setEncodedPng(downloadPngLink, 'diagram.png', null);
      copyPngLink.removeClass('active');
      currentPngData = null;
    }

    try {
      const { xml } = await modeler.saveXML({ format: true });
      setEncoded(downloadLink, 'diagram.bpmn', xml);
    } catch (err) {
      console.error('Error happened saving XML: ', err);
      setEncoded(downloadLink, 'diagram.bpmn', null);
    }
  }, 500);
  
  // Make exportArtifacts accessible to openDiagram function
  window.exportArtifactsFunc = exportArtifacts;

  modeler.on('commandStack.changed', exportArtifacts);
  
  // Automatically create a new diagram on page load
  createNewDiagram();
});



// helpers //////////////////////

function debounce(fn, timeout) {

  var timer;

  return function() {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}

