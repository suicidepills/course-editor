$(document).ready(function () {
    App($, ko);
});
function App ($, ko) {
    
    // Define Track, Chapter and Page models.
    var Track = function (id, title, chapters, optional, config) {
        var self = this;
        
        this.id     = ko.observable(id     || "");
        this.title  = ko.observable(title  || "New Title");
        this.config = ko.observable(config || {});
        this.optional = ko.observable(optional);
        this.chapters = ko.observableArray(chapters || []);
        
        this.addChapter = function () {
            self.chapters.push(new Chapter());
        };
        this.removeChapter = function (chapter) {
            self.chapters.remove(chapter);
        };
        
        this.moveChapterUp = function (chapter) {
            var index = self.chapters.indexOf(chapter());
            if (index-1 < 0) {
                return;
            }
            var c = self.chapters.splice(index-1, 1)[0];
            self.chapters.splice(index, 0, c);
        };
        
        this.moveChapterDown = function (chapter) {
            var index = self.chapters.indexOf(chapter());
            if (index+1 > self.chapters().length-1) {
                return;
            }
            var c = self.chapters.splice(index+1, 1)[0];
            self.chapters.splice(index, 0, c);
        };
    };
    
    var Chapter = function (id, title, pages, optional, config) {
        var self = this;
        
        this.id     = ko.observable(id || "");
        this.title  = ko.observable(title || "New Chapter");
        this.pages  = ko.observableArray(pages || []);
        this.optional = ko.observable(optional);
        this.config = config || {};
        
        this.addPage = function () {
            self.pages.push(new Page());
        };
        
        this.removePage = function (page) {
            self.pages.remove(page);
        };
        
        this.movePageUp = function (page) {
            var index = self.pages.indexOf(page());
            if (index-1 < 0) {
                return;
            }
            var c = self.pages.splice(index-1, 1)[0];
            self.pages.splice(index, 0, c);
        };
        
        this.movePageDown = function (page) {
            var index = self.pages.indexOf(page());
            if (index+1 > self.pages().length-1) {
                return;
            }
            var c = this.pages.splice(index+1, 1)[0];
            self.pages.splice(index, 0, c);
        };
    };
    
    var Page = function (id, title, path, optional, config) {
        var self = this;
        
        this.id     = ko.observable(id || "");
        this.config = config || {};
        this.title  = ko.observable(title || "New Page");
        this.optional = ko.observable(optional);
        this.path   = ko.observable(path || "path/to/content/");
    }
    
    // Define dummy model.
    var CourseModel = function () {
        var self = this;
        
        this.selectedTrack   = ko.observable();
        this.selectedChapter = ko.observable();
        this.selectedPage    = ko.observable();
        
        this.addTrack = function () {
            this.tracks.push(new Track());
        };
        
        this.removeTrack = function (track) {
            this.tracks.remove(track);
        };
        
        this.moveTrackUp = function (track) {
            var index = self.tracks.indexOf(track());
            if (index-1 < 0) {
                return;
            }
            var t = self.tracks.splice(index-1, 1)[0];
            this.tracks.splice(index, 0, t);
        };
        
        this.moveTrackDown = function (track) {
            var index = self.tracks.indexOf(track());
            if (index+1 > self.tracks().length-1) {
                return;
            }
            var t = this.tracks.splice(index+1, 1)[0];
            this.tracks.splice(index, 0, t);
        };
        
        /**
         * Parse raw course data into the editor so it can be manipulated.
         * @param json {String | Object} Raw course JSON/Object.
         * @return Void
         */
        this.parse = function (json) {
            // Save raw data for later.
            this.rawData = json;
            this.tracks = ko.observableArray([]);
            for(var track in json.tracks) {
                track = json.tracks[track];
                var t = new Track(track.id, track.label, [], track.optional, track.config);
                
                for(var chapter in track.chapters) {
                    chapter = json.chapters[track.chapters[chapter]];
                    var c = new Chapter(chapter.id, chapter.label, [], chapter.optional, chapter.config);
                    
                    for(var page in chapter.pages) {
                        page = json.pages[chapter.pages[page]];
                        var p = new Page(page.id, page.label, page.path, page.optional, page.config);
                        
                        c.pages.push(p);
                    }
                    
                    t.chapters.push(c);
                }
                
                this.tracks.push(t);
            }
        };
        
        /**
         * Parse the current course structure to JSON.
         * @return {String | Object}
         */
        this.toJSON = function () {
            var output          = {};
                output.tracks   = [];
                output.chapters = [];
                output.pages    = [];
                
            var rawTracks   = ko.toJS(this.tracks);
            
            for(var t in rawTracks) {
                t = rawTracks[t];
                
                output.tracks.push({
                    id: t.id,
                    label: t.title,
                    chapters: [],
                    config: t.config,
                    optional: t.optional
                });
                
                var rawChapters = ko.toJS(t.chapters);
                
                for(var c in rawChapters) {
                    c = rawChapters[c];
                    output.chapters.push({
                        id: c.id,
                        label: c.title,
                        pages: [],
                        config: c.config,
                        optional: c.optional
                    });
                    output.tracks[output.tracks.length - 1].chapters.push(c.id);
                    
                    var rawPages    = ko.toJS(c.pages);
                    for(var p in rawPages) {
                        p = rawPages[p];
                        output.pages.push({
                            id: p.id,
                            label: p.title,
                            config: p.config,
                            optional: p.optional
                        })
                        output.chapters[output.chapters.length - 1].pages.push(p.id);
                    }
                }
            }
            
            return $.extend(true, {}, this.rawData, output);
        };
    };
    
    var cm = new CourseModel();
    
    $.ajax({
        url: "data/data.json",
        success: function (data, status, xhr) {
            cm.parse(JSON.parse(data));
            ko.applyBindings(cm);
        }
    });
    
    $("#save-btn").bind("click", function () {
        function replacer(key, value) {
            if (key === "optional" && value === false) {
                return undefined;
            } else {
                return value;
            }
        }
        var json = JSON.stringify(cm.toJSON(), null, "\t").replace(/\n/g, "\r\n");
        
        console.log(json);
    })
}