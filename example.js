var __PDF_DOC,
  __CURRENT_PAGE,
  __TOTAL_PAGES,
  __PAGE_RENDERING_IN_PROGRESS = 0,
  __PAGE_RENDERING_COUNT = 0;

var __$CANVAS_CONTAINER = $('#pdf-canvas-container');
var __CANVAS_CONTAINER = __$CANVAS_CONTAINER.get(0);

var __PAGES = [];
var __PAGE_RENDERS = [];

var __SCALE = 0;
var __ROTATE = 0;

function cleanContainer() {
  __$CANVAS_CONTAINER.empty();
  __PAGE_RENDERS = [];
}

function showPDF(pdf_url) {
  $("#pdf-loader").show();

  PDFJS.getDocument({ url: pdf_url }).then(function (pdf_doc) {
    __PDF_DOC = pdf_doc;
    __TOTAL_PAGES = __PDF_DOC.numPages;

    // Hide the pdf loader and show pdf container in HTML
    $("#pdf-loader").hide();
    $("#pdf-contents").show();
    $("#pdf-total-pages").text(__TOTAL_PAGES);

    // Show the first page
    showPage(1);
  }).catch(function (error) {
    // If error re-show the upload button
    $("#pdf-loader").hide();
    $("#upload-button").show();

    alert(error.message);
  });
}

function showPage(page_no, scale, rotate) {
  __PAGE_RENDERING_IN_PROGRESS = 1;
  __CURRENT_PAGE = page_no;

  // Disable Prev & Next buttons while page is being loaded
  $("#pdf-zoom-in, #pdf-zoom-out").attr('disabled', 'disabled');

  // While page is being rendered hide the canvas and show a loading message
  // $("#pdf-canvas").hide();
  $("#page-loader").show();

  // Update current page in HTML
  $("#pdf-current-page").text(page_no);

  if (__PAGE_RENDERING_COUNT === 0) {
    for (var i = 1; i <= __PDF_DOC.numPages; i += 1) {
      __PAGES.push(__PDF_DOC.getPage(i));
    }
  }

  Promise.all(__PAGES).then(function (pages) {
    for (var i = 0; i < pages.length; i += 1) {
      var page = pages[i];

      // calc scale and rotate
      __SCALE = scale;
      if (!__SCALE) {
        // As the canvas is of a fixed width we need to set the scale of the viewport accordingly
        __SCALE = 750 / page.getViewport(1).width;
      }

      __ROTATE = rotate;
      if (!__ROTATE) {
        // default no rotate
        __ROTATE = 0;
      }

      console.log('=== scale, rotate: ', __SCALE, __ROTATE, ' ===');

      // Get viewport of the page at required scale
      var viewport = page.getViewport(__SCALE, __ROTATE);

      var canvas = document.createElement('canvas');
      __CANVAS_CONTAINER.append(canvas);

      // Set canvas height
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      console.log('=== width, height: ', canvas.height, canvas.width, ' ===');

      var renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
      };

      // Render the page contents in the canvas
      __PAGE_RENDERS.push(page.render(renderContext));
    }
  });

  Promise.all(__PAGE_RENDERS).then(function () {
    __PAGE_RENDERING_IN_PROGRESS = 0;
    __PAGE_RENDERING_COUNT += 1;

    // Re-enable Prev & Next buttons
    $("#pdf-zoom-in, #pdf-zoom-out").removeAttr('disabled');

    // Show the canvas and hide the page loader
    // $("#pdf-canvas").show();
    $("#page-loader").hide();
  });
}

// Upon click this should should trigger click on the #file-to-upload file input element
// This is better than showing the not-good-looking file input element
$("#upload-button").on('click', function () {
  $("#file-to-upload").trigger('click');
});

// When user chooses a PDF file
$("#file-to-upload").on('change', function () {
  var fileType = $("#file-to-upload").get(0).files[0].type;
  // Validate whether PDF
  if (['application/pdf'].indexOf(fileType) !== -1 || fileType.indexOf('image/') !== -1) {

    $("#upload-button").hide();

    // Send the object url of the pdf
    showPDF(URL.createObjectURL($("#file-to-upload").get(0).files[0]));
    return;
  }

  alert('Error : Not a PDF');
});

$("#pdf-zoom-in").on('click', function () {
  var nextScale = __SCALE * 1.2;
  cleanContainer();
  showPage(__CURRENT_PAGE, nextScale, __ROTATE);
});

$("#pdf-zoom-out").on('click', function () {
  var nextScale = __SCALE * 0.8;
  cleanContainer();
  showPage(__CURRENT_PAGE, nextScale, __ROTATE);
});

$('#pdf-rotate').on('click', function () {
  var nextRotate = __ROTATE + 90;
  if (nextRotate === 360) {
    nextRotate = 0
  }
  cleanContainer();
  showPage(__CURRENT_PAGE, __SCALE, nextRotate);
});

var clicked = false, clickX, clickY;
__$CANVAS_CONTAINER.on({
  'mousemove': function (e) {
    clicked && updateScrollPos(e);
  },
  'mousedown': function (e) {
    clicked = true;
    clickX = e.pageX;
    clickY = e.pageY;
  },
  'mouseup': function () {
    clicked = false;
    $('#pdf-canvas-container').css('cursor', 'auto');
  }
});

var updateScrollPos = function (e) {
  __$CANVAS_CONTAINER.css('cursor', 'move')
    .scrollTop(__$CANVAS_CONTAINER.scrollTop() + (clickY - e.pageY))
    .scrollLeft(__$CANVAS_CONTAINER.scrollLeft() + (clickX - e.pageX));
  clickX = e.pageX;
  clickY = e.pageY;
}
