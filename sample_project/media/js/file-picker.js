var uploader = null;
(function($) {

    $.filePicker = {
        conf: {
            url: '',
            urls: '',
        }
    };

    // constructor
    function FilePicker(root, conf) {   
        
        // current instance
        var self = this,
            tabs = null,
            browse_pane = null,
            upload_pane = null;
        
        root.append($('<div>').addClass('file-picker'));
        root = root.find('.file-picker');
        
        // methods
        $.extend(self, {

            getConf: function() {
                return conf;    
            },

            getRoot: function() {
                return root;    
            },

            load: function() {
                tabs.tabs('div.panes > div.pane', {effect: 'fade', fadeOutSpeed: 400});
                tabs.tabs().onClick(function(e, index) {
                    self.tabClick(e, index);
                });
                $.get(conf.url, function(response) {
                    conf.urls = response.urls;
                    self.getFiles();
                    self.getForm();
                });
            },

            tabClick: function(e, index) {
                $(document).find('.plupload').remove();
                if (index == 1) {
                    self.getForm(); 
                }else if (index == 0){
                    self.getFiles();
                }
            },
            
            getForm: function(data){
                if (!data) {
                    $.get(conf.urls.upload.file, {}, function(response){
                        self.displayForm(response);
                        self.setupUpload();
                    });
                } else {
                    $.post(conf.urls.upload.file, data, function(response){
                        if (response['insert']) {
                            $(self).trigger("onImageClick", [response.insert]);
                            self.getForm();
                        }else{
                            self.displayForm(response);
                            self.setupUpload();
                            var upload_form = upload_pane.find('.upload_form');
                            submit = $('<input>').
                                attr({'type': 'submit', 'value': 'Submit'}).
                                click( function(e) {
                                    e.preventDefault();
                                    var upload_form = upload_pane.find('.upload_form');
                                    data = {};
                                    $(':input', upload_form).each(function() {
                                        data[this.name]=this.value;
                                    });
                                    self.getForm(data);
                                })
                            upload_form.append(submit);
                        }
                    });
                }
            },
            
            displayForm: function(data){
                var pane = root.find('.file-picker-upload');
                pane.empty();
                pane.append($('<h2>').text('Select file to upload'));
                var browse = $('<input>').val('Select a file').attr({
                    'type': 'button',
                    'id': 'select-a-file',
                }).addClass('select-a-file');
                pane.append(browse);
                var runtime = $('<div>').addClass('runtime');
                pane.append(runtime);
                pane.append($('<ul>').addClass('upload-list'));
                pane.append($('<h3>').text('File details'));
                var form = $('<form>').attr({
                    'method': 'post', 'class': 'upload_form', 'action':'',
                });
                var table = $('<table>').html(data.form)
                form.append(table);
                pane.append(form);
            },
            
            getFiles: function(data) {
                if (!data) {
                    data = {};
                }
                $.get(conf.urls.browse.files, data, function(response) {
                    self.displayFiles(response);
                });
            },
            
            setupUpload: function() {
                    uploader = new plupload.Uploader({
                    runtimes : 'html5',//'gears,html5,flash,silverlight,browserplus',
                    browse_button : 'select-a-file',
                    max_file_size : '20mb',
                    url : conf.urls.upload.file,
                    multi_selection: false,
                    filters : [
                        {title : "Image files", extensions : "jpg,gif,png"},
                        {title : "Zip files", extensions : "zip"}
                    ]
                });
                
                uploader.bind('Init', function(up, params) {  
                    upload_pane.find('.runtime').html('Upload runtime: ' + params.runtime);
                });
                
                uploader.bind('PostInit', function(up) {
                    $(document).find('div.plupload').css({'position': 'fixed'});
                });
                
                uploader.bind('FilesAdded', function(up, files) {
                    var list = upload_pane.find('.upload-list');
                    list.empty();
                    $.each(files, function(i, file) {
                        var li = $('<li>').attr({'id': file.id});
                        li.append($('<span>').text(file.name + ' (' + plupload.formatSize(file.size) + ') '));
                        li.append('<b>');
                        list.append(li);
                        up.removeFile(file);
                        upload_pane.find('.add_to_model').remove();
                    });
                });
                
                uploader.bind('QueueChanged', function(up) {
                    if ( up.files.length > 0 && uploader.state != 2) {
                        uploader.start();
                        
                    }
                });
                
                uploader.bind('UploadProgress', function(up, file) {
                    $('#' + file.id + " b").html(file.percent + "%");
                });
                
                uploader.bind('FileUploaded', function(uploader, file, response){
                    submit = $('<input>').attr(
                            {'class': 'add_to_model', 'type': 'submit', 'value': 'Submit'}
                        ).
                        click( function(e) {
                            e.preventDefault();
                            var upload_form = upload_pane.find('.upload_form');
                            var data = {};
                            $(':input', upload_form).each(function() {
                                data[this.name]=this.value;
                            });
                            data['file'] = response['response'];
                            self.getForm(data);
                        })
                        var upload_form = upload_pane.find('.upload_form');
                        upload_form.append(submit);
                        });
                uploader.init();
            },

            displayFiles: function(data) {
                var files = data.result;
                browse_pane.empty();
                browse_pane.append($('<h2>').text('Select file to insert'));
                var table = $('<table>').addClass('file-list');
                var tr = $('<tr>');
                var form = $('<form>').attr({
                     'action': "",
                     'method': 'get',
                     'class': 'file-picker-search'
                });
                form.append(
                    $('<input>').attr({ 'type': 'text',
                    'class':'search_val','name':'search'}).val(data.search)
                );
                form.append(
                    $('<input>').attr({ 'type': 'submit', 'value':'Search'})
                    .addClass('search_val').click(
                    function(e) {
                        e.preventDefault();
                        self.getFiles(
                        {'search': browse_pane.find('.search_val').val() }
                        );
                    })
                );
                var tr = $('<tr>');
                tr.append($('<th>').text('Thumbnail'));
                var extra = files[0].extra
                $.each(extra, function(key, value){
                    tr.append($('<th>').text(key));
                });
                table.append(tr);
                $.each(files, function(idx, file) {
                    var tr = $('<tr>');            
                    var a = $('<a>').click(function(e) {
                        $(self).trigger("onImageClick", [file.insert]);
                    });
                    var img = $('<img>').attr({
                        'alt': file.name,
                        'src': file.thumb.url,
                        'width': file.thumb.width,
                        'height': file.thumb.height
                    });
                    a.append(img);
                    tr.append($('<td>').append(a));
                    $.each(file.extra, function(key,value){
                        tr.append($('<td>').text(value));
                    });
                    table.append(tr);
                });
                var div = $('<div>').attr({'class': 'scrollable'});
                browse_pane.append(form);
                browse_pane.append(div.append(table));
                var footer = $('<div>').attr('class', 'footer');
                var next = $('<a>').attr({
                        'title': 'Next',
                        'href': '#'
                    }).text('Next')
                if (data.has_next) {
                    next.click(function(e) {
                        e.preventDefault();
                        self.getFiles({'page': data.page + 1, 
                        'search': browse_pane.find('.search_val').val()});
                    });
                } else {
                    next.css('color', '#bbb');
                }
                var previous = $('<a>').attr({
                        'title': 'Next',
                        'href': '#'
                    }).text('Previous ')
                if (data.has_previous) {
                    previous.click(function(e) {
                        e.preventDefault();
                        self.getFiles({'page': data.page - 1, 
                        'search': browse_pane.find('.search_val').val()});
                    });
                } else {
                    previous.css('color', '#bbb');
                }
                footer.append(previous);
                $.each(data.pages, function(index, value){ 
                        var list = $('<a>').attr({
                            'title': value,
                            'href': '#'
                        }).text(value+' ')
                        if (data.page==value) {
                            list.css('color', '#bbb');
                        } else {
                            list.click(function(e) {
                                e.preventDefault();
                                self.getFiles({'page': value, 
                                'search': browse_pane.find('.search_val').val()});
                            });
                        }
                        footer.append(list);
                });
                footer.append(next);
                browse_pane.append(footer);
            },
        });

        // callbacks    
        $.each(['onImageClick',], function(i, name) {
            // configuration
            if ($.isFunction(conf[name])) { 
                $(self).bind(name, conf[name]); 
            }
            self[name] = function(fn) {
                $(self).bind(name, fn);
                return self;
            };
        });
        
        // setup tabs
        var tabs = $('<ul>').addClass('css-tabs').addClass('file-picker-tabs');
        tabs.append($('<li>').append($('<a>').attr('href', '#').text('Browse')));
        tabs.append($('<li>').append($('<a>').attr('href', '#').text('Upload')));
        var panes = $('<div>').addClass('panes');
        browse_pane = $('<div>').addClass('file-picker-browse').addClass('pane');
        browse_pane.append($('<h2>').text('Browse for a file'));
        panes.append(browse_pane);
        upload_pane = $('<div>').addClass('file-picker-upload').addClass('pane')
        panes.append(upload_pane);
        root.append(tabs);
        root.append(panes);
    } 


    // jQuery plugin implementation
    $.fn.filePicker = function(conf) {
        // already constructed --> return API
        var el = this.data("filePicker");
        if (el) { return el; }

        conf = $.extend({}, $.filePicker.conf, conf);

        this.each(function() {
            el = new FilePicker($(this), conf);
            $(this).data("filePicker", el);
        });

        return conf.api ? el: this;
    };


})(jQuery);

function insertAtCaret(areaId,text) { 
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? "ff" : (document.selection ? "ie" : false ) );
    if (br == "ie") { txtarea.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -txtarea.value.length);
        strPos = range.text.length;
    } else if (br == "ff") strPos = txtarea.selectionStart;
    var front = (txtarea.value).substring(0,strPos);
    var back = (txtarea.value).substring(strPos,txtarea.value.length);
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") { 
        txtarea.focus();
        var range = document.selection.createRange();
        range.moveStart ('character', -txtarea.value.length);
        range.moveStart ('character', strPos);
        range.moveEnd ('character', 0);
        range.select();
    } else if (br == "ff") { 
        txtarea.selectionStart = strPos;
        txtarea.selectionEnd = strPos;
        txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
}
