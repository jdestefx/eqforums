var UNDEF = "undefined";

//var siteURL = "https://forums.station.sony.com/eqnlandmark/";
var siteURL = "https://forums.daybreakgames.com/eq/";

var _forumBar = function(opts) {
   var fb = this;

   // inits
   fb.actualHTML = undefined;
//   fb.fetchURL = "https://forums.station.sony.com/eqnlandmark/index.php";
   fb.fetchURL = "https://forums.daybreakgames.com/eq/index.php";

   fb.allEntries = [];

   fb.construct = function() {
      fb.body = $(document.body).find(".forum-container-wrapper .forum-container");
      fb.fetchForumList(fb.renderForumList);
   }

   // methods
   fb.fetchForumList = function(callback) {
      $.ajax({url:"fetchit.php", type:"post", dataType:"html", data: JSON.stringify({m:1, url: fb.fetchURL}),
         success: function(data) {
            fb.actualHTML = $(data);
            if (typeof callback != undefined) callback(data);
         }
      });
   }

   fb.renderForumList = function() {
      var mainSection = fb.actualHTML.find(".sectionMain");
      var titles = mainSection.find(".nodeList .nodeTitle");

      fb.allEntries.length = 0;

      titles.each(function() {
         fb.allEntries.push( new fb._forumEntry({text: $(this).find("a").text(), url: $(this).find("a").attr("href")}) );
      });
   }

   this._forumEntry = function(opts) {
      var fe = this;

      $.extend(this, {
         url: undefined,
         text: undefined,
      }, opts);

      fe.construct = function() {
         fe.body = $("<div class=\"yui3-u-1 forum-entry fullwhite\"></div>");
         fe.body.appendTo(fb.body);
         fe.body.text(fe.text);
         fe.body.on({click: fe.onClicked});
      }

      fe.onClicked = function(event) {
         fb.body.find(".selected").toggleClass("selected", false);
         fe.body.toggleClass("selected", true);
         threadList.loadURL(fe.url);
      }

      fe.construct();
      return this;
   }


   fb.construct();
   return this;

}

// ============ MIDDLE SECTION =============
var _threadList = function(opts) {
   var tl = this;

   tl.currentURL = undefined;
   tl.allThreads = [];

   tl.construct = function() {
      tl.body = $(document.body).find(".thread-container");
   }

   tl.renderThreadList = function() {
      var listitems = tl.actualHTML.find(".discussionListItem");

      tl.body.empty();
      tl.allThreads.length = 0;

      listitems.each(function() {
         tl.allThreads.push(
            new tl._thread({
               threadID: $(this).attr("ID").slice($(this).attr("ID").indexOf("-")+1, $(this).attr("ID").length ),
               text: $(this).find(".titleText .previewTooltip").text(),
               url: $(this).find(".titleText .previewTooltip").attr("href")
            })
         );
      });
   }

   tl.loadURL = function(url) {
      tl.currentURL = siteURL + url;
      $.ajax({url:"fetchit.php", type:"post", dataType:"html", data: JSON.stringify({m:1, url: tl.currentURL}),
         success: function(data) {
            tl.actualHTML = $(data);
            tl.renderThreadList();
         }
      });
   }

   // children
   this._thread = function(opts) {
      var te = this;

      $.extend(this, {
         threadID: undefined,
         url: undefined,
         text: undefined
      }, opts);

      // inits
      te.numPages = undefined;


      te.construct = function() {
         te.body = $("<div class=\"yui3-u-1 forum-entry fullwhite\"></div>");
         te.body.appendTo(tl.body);
         te.body.text(te.text);
         te.body.on({click: te.onClicked});

         //te.pager = new te._pager();

      }

      // events
      te.onClicked = function(event) {
         tl.body.find(".selected").toggleClass("selected", false);
         te.body.toggleClass("selected", true);
         threadViewer.loadURL(te.url,te.threadID);
      }

      te.construct();
      return this;
   }
   this._pager = function(opts) {
      var pager = this;

      pager.construct = function() {
         pager.body = $("<div class=\"\"></div>");
         pager.body.appendTo(tl.body);

         //if (te.body.find(".pageNavLinkGroup").length == 0) return;



      }


      this._page = function(opts) {
         var page = this;

         page.construct = function() {

         }

         page.construct();
         return this;

      }


      pager.construct();
      return this;
   }

   tl.construct();
   return this;
}


// ============ RIGHT SECTION =============

var _threadViewer = function(opts) {
   var tv = this;

   tv.currentThreadID = undefined;
   tv.currentURL = undefined;
   tv.allEntries = [];
   tv.numPages = undefined;
   tv.actualHTML = undefined;

   tv.construct = function() {
      tv.body = $(document.body).find(".thread-viewer-container");
      // pager setup is in tv.renderThreadList();
   }

   // methods
   tv.insertContent = function(html, fromPage) {
      var listitems = html.find("li.message");
      var jumpToItem;

      listitems.each(function() {
         var entry = $(this);
         var newEntry = new tv._threadEntry({
            fromPage: fromPage,
            postID: entry.attr("ID").slice( entry.attr("ID").indexOf("-")+1, entry.attr("ID").length),
            author: entry.attr("data-author"),
            html: entry.find(".messageContent").html()
         });

         for (var i=tv.allEntries.length-1;i>=0; i--) {
            
            if (typeof tv.allEntries[i].forPageNumber != UNDEF) { // hit a pager?
               if (tv.allEntries[i].forPageNumber > fromPage) continue;
               //delete tv.allEntries[i].forPageNumber;
            } else {
               // otherwise examining normal entries
               if (tv.allEntries[i].postID > newEntry.postID) continue;
            }

            tv.allEntries[i].body.after(newEntry.body);
            tv.allEntries.splice(i+1, 0, newEntry);

            // if (jumpToItem==undefined) {
            //    jumpToItem = newEntry;
            //    //tv.body.scrollTop( newEntry.body.offset().top );
            // }

            break;
         }

      });
   }
   tv.renderThreadList = function() {
      var listitems = tv.actualHTML.find("li.message");

      delete tv.pager;
      tv.body.empty();
      tv.allEntries.length = 0;

      listitems.each(function() {
         var threadMetaID = $(this).attr("ID");
         tv.allEntries.push(
            new tv._threadEntry({
               fromPage: 1,
               postID: threadMetaID.slice( threadMetaID.indexOf("-")+1, threadMetaID.length),
               author: $(this).attr("data-author"),
               html: $(this).find(".messageContent").html(),
            })
         );
      });

      tv.pager = new tv._pager({onContentLoaded: tv.insertContent});
   }

   tv.loadURL = function(url, threadID) {
      tv.currentThreadID = threadID;
      tv.currentURL = siteURL + url;
      $.ajax({url:"fetchit.php", type:"post", dataType:"html", data: JSON.stringify({m:1, url: tv.currentURL}),
         success: function(data) {
            tv.actualHTML = $(data);
            tv.renderThreadList();
         }
      });
   }

   // children
   this._pagebar = function(opts) {
      var pb = this;

      $.extend(this, {
         forPageNumber: undefined,
      }, opts);

      pb.construct = function() {
         pb.body = $("<div class=\"yui3-u-1 thread-entry page-bar fullwhite\"></div>");
         pb.body.appendTo(tv.body);
         pb.body.text("Click to load page " + pb.forPageNumber);
         pb.body.on({click: pb.onClicked});
      }

      pb.onClicked = function(event) {
         tv.pager.triggerPageByNumber(pb.forPageNumber);
      }

      pb.construct();
      return this;

   }
   this._threadEntry = function(opts) {
      var te = this;

      $.extend(this, {
         fromPage: undefined,
         postID: undefined,
         author: undefined,
         html: undefined,
         appendToBody: true,
      }, opts);

      te.construct = function() {
         te.body = $("<div class=\"yui3-u-1 thread-entry fullwhite\"></div>");

         if (te.appendToBody==true) te.body.appendTo(tv.body);

         te.html = te.html.replace(/style=".+?"/g,"");

         if ( $(te.html).text().length < 20) {
            te.body.html("... pointless reply auto-muted ...");
            te.body.css({"color":"gray", "font-size": "9px", "padding": "0px 3px 0px 3px"});
            //te.body.remove();
            //console.log("removed:", $(te.html).text());
            return;
         }


         te.body.html(te.html).find(".attributionlink").remove();

         te.lblAuthor = $("<div class=\"yui3-u author\"></div>");
         te.lblAuthor.appendTo(te.body);
         te.lblAuthor.text("Post ID: " + te.postID + " by " + te.author);

         // te.lblPage = $("<div class=\"yui3-u pagenum\"></div>");
         // te.lblPage.appendTo(te.body);
         // te.lblPage.text("Page "+ te.fromPage);



         te.body.on({click: te.onClicked});

         if (te.html.indexOf("aside") != -1) te.configureQuote();
      }


      // events
      te.onClicked = function(event) {
         //threadBar.loadURL(fe.url);
      }
      te.onQuoteClicked = function(event) {
         te.body.find("aside").css({"overflow-y": "auto"});
      }

      // methods
      te.configureQuote = function() {
         te.body.on({click: te.onQuoteClicked});
      }

      te.construct();
      return this;
   }
   this._pager = function(opts) {
      var pager = this;

      $.extend(this, {
         onContentLoaded: $.noop,
      }, opts);

      pager.allPages = [];

      pager.construct = function() {
         pager.body = $("<div class=\"yui3-u-1 pager\"></div>");
         pager.body.appendTo(tv.body);
         if (tv.actualHTML.find(".pageNavLinkGroup").length == 0) return;

         if (tv.actualHTML.find(".PageNav").length==0) {
            tv.body.css({"padding-top": "0px"});
         } else {
            tv.body.css({"padding-top": "26px"});
            tv.numPages = parseInt(tv.actualHTML.find(".PageNav").attr("data-last"));
            pager.setupXPages(tv.numPages);
         }

      }

      pager.triggerPageByNumber = function(pageNum) {
         for (var i=0;i<pager.allPages.length;i++) {
            if (pager.allPages[i].number == pageNum) {
               pager.allPages[i].loadContent();
               break;
            }
         }
      }

      pager.setupXPages = function(numPages) {
         pager.allPages.length = 0;
         pager.body.empty();

         for (var i=1;i<=numPages;i++) {
            var newPage = new pager._page({
               onContentLoaded: tv.insertContent,
               url: tv.currentURL + "page-"+(i+1),
               number: i+1
            })

            pager.allPages.push(newPage);
            tv.allEntries.push(newPage.pagebar);

         }
      }

      this._page = function(opts) {
         var page = this;

         $.extend(this, {
            url: undefined,
            number: undefined
         }, opts);

         page.loaded = false;
         page.pagebar = undefined;

         page.construct = function() {
            page.body = $("<div class=\"yui3-u page-button\"></div>");
            page.body.appendTo(pager.body);
            page.body.text(page.number);
            page.body.on({click: page.onClicked});
            page.body.toggleClass("loaded", page.loaded);

            page.pagebar = new tv._pagebar({forPageNumber: page.number});

         }

         page.onClicked = function(event) {
            page.loadContent();
         }
         page.loadContent = function() {
            
            if (page.loaded==true) {
               tv.body.scrollTop(page.pagebar.body.offset().top-10);
               return;
            }

            $.ajax({url:"fetchit.php", type:"post", dataType:"html", data: JSON.stringify({m:1, url: page.url}),
               success: function(data) {
                  page.actualHTML = $(data);
                  page.loaded = true;
                  page.body.toggleClass("loaded", page.loaded);
                  pager.onContentLoaded(page.actualHTML, page.number);
                  tv.allEntries.splice(tv.allEntries.indexOf(page),1);
                  page.pagebar.body.text("Start of page " + page.number);
                  page.pagebar.body.off("click");
                  tv.body.scrollTop(page.pagebar.body.offset().top-10);
                  //page.removePageBar();
               }
            });
         }
         page.removePageBar = function() {
            page.pagebar.body.remove();
         }

         page.construct();
         return this;

      }




      pager.construct();
      return this;
   }

   tv.construct();
   return this;
}