function TimeTable(usrParam) {

    var defaultParam = {
        queryParams: "",
        onFilterChange: function () { },
        target: $(document.body),
        baseTemplate: $("#base-template-ctn"),
        urls: {
            saveUrl: '/filtering/SaveFiltering',
            getLists: '/filtering/getListsActivedInTimeTable',
            getFilters: '/filtering/getAllFilters'
        }
    };
    var params = $.extend(true, defaultParam, usrParam);

    if (!params.target || params.target.size() === 0) {
        throw "Target not found";
    }
    if (!params.baseTemplate || !params.baseTemplate.size() === 0) {
        throw "Base template not found";
    }

	var user_filters = null;
    var baseTpl = params.baseTemplate.clone();
	baseTpl.removeAttr('id');
    baseTpl.appendTo(params.target);
    baseTpl.show();


    ht_draw();

    function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    function french_dow(i) {
        return moment.weekdays()[(i + 1) % 7];
    }

    function ht_color(C) {
        //easy coz three list, three color, but the idea will be the same
        return "rgb(" + ((C.adult) ? 127 : 0) + "," + ((C.violence) ? 127 : 0) + "," + ((C.social) ? 127 : 0) + ");";
    }

    function ht_draw() {
        var tableBody = baseTpl.find('tbody'); ;

        for (var i = 0; i < 48; i++) {
            var line = $('<tr>');
            line.append('<td><div>' + Math.floor(i / 2) + ':' + (((i % 2) === 0) ? '00' : '30') + '</div></td>');

            for (var j = 0; j < 7; j++) {
                var cell = $('<td class="ui-selectee">');
                cell.attr('data-hour', i);
                cell.attr('data-day', j);

                for (var k = 0; k < 12; k++) {
                    var subCell = $('<span>');
                    subCell.addClass('ht_' + i + '_' + j + '_' + k);
                    subCell.width('8.33%');
                    subCell.appendTo(cell);
                }
                cell.appendTo(line);
            }
            line.appendTo(tableBody);
        }
    }
    function shadeColor(color, percent) {  // deprecated. See below.
        var num = parseInt(color.slice(1), 16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }


    function ht_draw_area(obj) {
        var ret = new Array();
        var ilist_area = function (i) {
            var list_area = "<div data-name=\"" + obj.name + "\" class=\"editable_area\" style=\"" + i + "\">";
            list_area += "  <div style=\"position: absolute; top: 0; left: 0; right 0; height: 10px; width: 94%; margin-left: 3%;margin-right: 3%;\">";
            list_area += "    <div class=\"ht_close\">âœ—</div>";
            list_area += "  </div>";
            list_area += "</div>";

            list_area = $(list_area);

            //set border color
            var borderColor = shadeColor(obj.couleur, -20);
            list_area.css('color', borderColor);
            list_area.css('border-color', borderColor);

            list_area.find(".ht_close").click(function () {
                ht_remove_area(obj.name);
            });


            return list_area;
        }

        var size = Math.floor(12 / (obj.max + 1));
        var h = (obj.eh - obj.h) * 20 + 0;
        var offset = obj.offset * size;
        var eoffset = offset + size;
        var idx = Math.ceil((12 * obj.offset) / (obj.max + 1));
        var w = (baseTpl.find(".selectable .ui-selectee").width() / 12) * (eoffset - offset);
        for (var days = obj.d; days < obj.ed; days++) {
            var div = ilist_area("width: " + w + "px; height: " + h + "px;background-color: " + obj.couleur);
            baseTpl.find(".ht_" + obj.h + "_" + days + "_" + idx).append(div);
            ret.push(div);
        }
        return ret;
    }

    //
    var users_area = {};
    //named area
    var areas = {};
    //list of areas in array case
    var current_areas = {}; //{ 0: { 1: new Array() } };

    function current_areas_f(hour, day, ehour, eday, f) {
        for (var d = day; d < eday; d++) {
            if (!(d in current_areas)) current_areas[d] = {};
            for (var h = hour; h < ehour; h++) {
                f(d, h);
            }
        }
    }

    current_areas_f(0, 0, 48, 7, function(d, h) {
        current_areas[d][h] = new Array();
    });

    function ht_overlap_max(hour, day, ehour, eday) {
        var ret = 0;
        current_areas_f(hour, day, ehour, eday, function(d, h) {
            ret = Math.max(current_areas[d][h].length, ret);
        });
        return ret;
    }

    function ht_overlap_min(hour, day, ehour, eday, m) {
        var ret = m;
        current_areas_f(hour, day, ehour, eday, function(d, h) {
            for (var e = 0; e < current_areas[d][h].length; e++) {
                var name = current_areas[d][h][e];
                ret = Math.min(areas[name].offset, ret);
            }
        });
        return ret;
    }

    function ht_overlap_names(hour, day, ehour, eday) {
        var ret = new Array();
        current_areas_f(hour, day, ehour, eday, function(d, h) {
            for (var e = 0; e < current_areas[d][h].length; e++) {
                var zone = current_areas[d][h][e];
                if (ret.indexOf(zone) == -1) ret.push(zone);
            }
        });
        return ret;
    }

    function ht_remove_area(name) {
        $.each(areas[name].div, function(i) {
            areas[name].div[i].remove();
        });
        delete areas[name];
        current_areas_f(0, 0, 48, 7, function(d, h) {
            var idx = current_areas[d][h].indexOf(name);
            if (idx != -1) current_areas[d][h].splice(idx, 1);
        });
        baseTpl.find(".ht_sub_list_" + name).remove();

        $.each(users_area, function(n) {
            var changed = $.grep(users_area[n], function(o, index) {
                return (o.name != name);
            });
            if (changed.length > 0) {
                users_area[n] = changed;
            } else {
                baseTpl.find(".ht_list_" + n.replace(" ", "-")).remove();
                delete users_area[n];
            }
        });
    }

    function ht_close(event) {
        event.preventDefault();
        event.stopPropagation();
        var name = baseTpl.find(this).parent().parent().data("name");
        ht_remove_area(name);
    }

    function ht_close_list(event) {
        event.stopPropagation();
        var name = baseTpl.find(this).data("name");
        ht_remove_area(name);
    }

    function ht_close(event) {
        event.preventDefault();
        event.stopPropagation();
        var name = baseTpl.find(this).parent().parent().data("name");
        ht_remove_area(name);
    }

    var unique = 0;

    function ht_remove_graph(o) {
        if (o.div !== null) $.each(o.div, function(i) {
            o.div[i].remove();
        });
    }
	
	//hour, day, ehour, eday, gname, couleurParam, list
    function ht_insert_area(hour, day, ehour, eday, gname, listCat, listName, couleur) {
	  var new_max_target = ht_overlap_max(hour, day, ehour, eday);
	  var areas_to_change = ht_overlap_names(hour, day, ehour, eday);
	  unique++;
	  var name = "new" + unique;
	  //insert the new zone

	  var empty_offset = new_max_target;
	  for (var v = 0; v < new_max_target; v++) {
		var found = false;
		$.each(areas_to_change, function(i) {
		  found = found || (areas[areas_to_change[i]].offset == v);
		});
		if (found === false) {
		  empty_offset = v;
		  break;
		}
	  }
	  areas[name] = {  h : hour, d : day
					, eh : ehour, ed : eday
					, "name": name
					, "user_name": gname
					, offset: empty_offset
					, max: new_max_target
					, div: null
					, user : {}
					, couleur: couleur
					, category: listCat
					, listName: listName
					};
	  current_areas_f(hour, day, ehour, eday, function(d,h) {
		if (current_areas[d][h].indexOf(name) == -1 ) {
		  current_areas[d][h].push(name);
		}
	  });
	  
	  //resize and draw
	  $.each(areas_to_change,function(n) {
		var o = areas[areas_to_change[n]];
		o.max = Math.max(o.max,new_max_target);
		ht_remove_graph(o);
		areas[areas_to_change[n]].div = ht_draw_area(o);
	  });
	  areas[name].div = ht_draw_area(areas[name]);
	  if (!(gname in users_area)) {
		users_area[gname] = new Array();
	  }
	  users_area[gname].push(areas[name]);
	  return areas[name];
	}

    function ht_change_time(e, name) {
        var elem = baseTpl.find(e.target);
        var area = areas[name];

        var isEnd = elem.hasClass("ht_input_end");
        var isMin = elem.hasClass("ht_input_min");

        var newVal = Number(elem.val());

        if (isMin && newVal !== 0 && newVal !== 30) {
            throw "Only half hour";
        }

        if (!isMin && (Math.floor(newVal) !== newVal || newVal < 0 || newVal > 24)) {
            throw "hours must be integer between 0 and 24";
        }

        var timeToSet = Number(elem.parent().find(".ht_input_hour").val()) * 2 +
            Math.floor(Number(elem.parent().find(".ht_input_min").val()) / 30);

        if (isEnd) {
            if (timeToSet <= area.h) {
                throw "Hour range error";
            }
            area.eh = timeToSet;
        } else {
            if (timeToSet >= area.eh) {
                throw "Hour range error";
            }
            area.h = timeToSet;
        }


        ht_remove_graph(area);
        area.div = ht_draw_area(area);

        on_time_slot_change(name);
    }

    function ht_change_day(e, name) {
        var area = areas[name];

        var thisElem = baseTpl.find(e.target);

        var isEndDay = thisElem.hasClass("day_end");
        var val = Number(thisElem.val());
        var endDay = isEndDay ? val : area.ed;
        var startDay = isEndDay ? area.d : val;

        if (endDay <= startDay) {
            thisElem.css({
                color: "red"
            });
            thisElem.val((isEndDay ? area.ed : area.d));
            return;
        }


        area.d = startDay;
        area.ed = endDay + 1;

        ht_remove_graph(area);
        area.div = ht_draw_area(area);

        on_time_slot_change(name);
    }

    function ht_day_combo(opt, d) {
        var ret = "<select " + opt + ">";
        for (var i = 0; i < 7; i++) {
            ret += "<option opt value=\"" + i + "\" " + ((i == d) ? "selected" : "") + ">" + french_dow(i) + "</option>";
        }
        ret += "</select>";
        return ret;
    }

    function ht_list() {
        baseTpl.find(".palette").html("");
        $.each(users_area, function (uname) {
            baseTpl.find(".palette").append($(
                "<div class=\"ht_list ht_list_" + uname.replace(" ", "-") + "\"><h4>" + uname + "</h4></div>"
            ));
            $.each(users_area[uname], function (obj_index) {
                var n = users_area[uname][obj_index].name;
                var text_list = areas[n].list_name;
                var hour = Math.floor(areas[n].h / 2);
                var minutes = (areas[n].h % 2 == 0) ? 0 : 30;
                var ehour = Math.floor(areas[n].eh / 2);
                var eminutes = (areas[n].eh % 2 == 0) ? 0 : 30;

                var new_item = "<div class=\"ht_sub_list_" + areas[n].name + "\" class=\"sub_list_filter\">"
                + "<div class=\"row\" style=\"padding-top: 1em;\">"
                + "<div class=\"col-xs-1 col-md-1\">"
                + "<span style=\"height: 30px; display: inline-block; width: 30px; vertical-align: middle;  margin-right: 1em; margin-bottom: 2px; background-color: "
                + areas[n].couleur
                + "\">   </span>"
                + "</div>"
                + "<div class=\"col-xs-3 col-md-3\" style=\"text-align: right;\">"
                + ht_day_combo("class=\"day_select day_start\"", areas[n].d)
                + "</div>"
                + "<div class=\"col-xs-4 col-md-4\">"
                + "to "
                + ht_day_combo("class=\"day_select day_end\"", areas[n].ed - 1)
                + "</div>"
                + "<div class=\"col-xs-2 col-md-2\" style=\"text-align: right;\">"
                + "<button class=\"delete-btn\"  data-name=\""
                + areas[n].name
                + "\">Delete</button>"
                + "</div>"
                + "</div>"
                + "<div class=\"row\">"
                + "<div style=\"padding: 0;\" class=\"col-xs-5 col-md-5\">"
                + "<div style=\"height: auto;\" class=\"row-fluid\">"
                + "<div class=\"col-xs-3 col-md-3\">start"
                + "</div>"
                + "<div class=\"col-xs-9 col-md-9\">"
                + "<input class=\"ht_input_time ht_input_start ht_input_hour\" style=\"width: 50px;\" maxlength=\"2\" size=\"2\" min=\"0\" max=\"24\" step=\"1\" type=\"number\" value=\""
                + hour
                + "\" >"
                + ":<input class=\"ht_input_time ht_input_start ht_input_min\"style=\"width: 50px;\" maxlength=\"2\" size=\"2\" min=\"0\" max=\"30\" step=\"30\"  type=\"number\" value=\""
                + minutes
                + "\" >"
                + "</div>"
                + "</div>"
                + "<div class=\"row-fluid\">"
                + "<div class=\"col-xs-3 col-md-3\">end"
                + "</div>"
                + "<div class=\"col-xs-9 col-md-9\">"
                + "<input class=\"ht_input_time ht_input_end ht_input_hour\" style=\"width: 50px;\" maxlength=\"2\" size=\"2\" min=\"0\" max=\"24\" step=\"1\" type=\"number\" value=\""
                + ehour
                + "\" >"
                + ":<input class=\"ht_input_time ht_input_end ht_input_min\" style=\"width: 50px;\" maxlength=\"2\" size=\"2\" min=\"0\" max=\"30\" step=\"30\"  type=\"number\" value=\""
                + eminutes
                + "\" >"
                + "</div>"
                + "</div>"
                + "</div>"
                + "<div class=\"col-xs-7 col-md-7\" style=\"text-align: left;\" >"
                + '<b>'
                + areas[n].category
                + '</b>'
                + '&nbsp; - &nbsp;'
                + areas[n].listName
                + "</div>"
                + "</div>";

                new_item = $(new_item);
                new_item.find(".delete-btn").click(function () {
                    ht_remove_area(areas[n].name);
                });

                new_item.find(".day_select").change(function (e) {
                    ht_change_day(e, areas[n].name);
                });

                //new_item.find("");
                new_item.find(".ht_input_time").focus(function (e) {
                    var el = baseTpl.find(e.target);
                    var val = el.val();
                    el.data("oldVal", val);
                });

                new_item.find(".ht_input_time").bind("input", function (e) {
                    var el = baseTpl.find(e.target);

                    //if hour max, no minuts allowed 
                    if (el.hasClass('ht_input_hour')) {
                        var minuts = el.next('input');

                        if (el.val() == 24) {
                            minuts.prop('disabled', true);
                            minuts.val(0);
                        } else {
                            minuts.prop('disabled', false);
                        }
                    }

                    try {
                        ht_change_time(e, areas[n].name);
                        el.data("oldVal", el.val());
                    } catch (e) {
                        el.val(el.data("oldVal"));
                        throw e;
                    }
                });

                baseTpl.find(".ht_list_" + uname.replace(" ", "-")).append(new_item);
            });
            baseTpl.find(".ht_list_" + uname.replace(" ", "-")).append($("<hr>"));
        });
    }

    function on_time_slot_change() {


    }
	
	function _sendDataToServer(onDataSent){
        var allAreas = [];

        for (aKey in areas) {
            if (!areas.hasOwnProperty(aKey))
                continue;

            var elem = areas[aKey];
            var readableObj = {
                filterId: elem.name,
                filterName: elem.user_name,
                fromHour: elem.h,
                toHour: elem.eh,
                fromDay: elem.d,
                toDay: elem.ed,
				color: elem.couleur,
				category: elem.category,
				listName: elem.listName
            };

            allAreas.push(readableObj);
        }
		
		
        $.ajax({
            url: params.urls.saveUrl + '?' + params.queryParams,
            type: 'POST',
            data: JSON.stringify(allAreas),
            contentType: 'application/json; charset=utf-8',
            success: function(e) {
				if(onDataSent && typeof(onDataSent) === "function") {
					onDataSent(true);
				}
			},
			error: function(jqXHR, textStatus, errorThrown){
				if(onDataSent && typeof(onDataSent) === "function") {
					onDataSent(false, textStatus + ' : ' + errorThrown);
				}
			}
        });
	}

	
    function _load_time_slot(elems) {
        elems = Array.isArray(elems) ? elems : [elems];

        for (var i = 0, l = elems.length; i < l; i++) {
            var elem = elems[i];
			if(jQuery.isEmptyObject(elem)) {
				continue;
			}
			
            var el = ht_insert_area(elem.fromHour, elem.fromDay, elem.toHour, elem.toDay, elem.filterName, elem.category , elem.listName, elem.color);
            el.user.list = elem.filterCat;
            ht_list();
        }
    }
	
	function _loadFilterList(cb){
		$.ajax({
		    url: params.urls.getLists + '?' + params.queryParams, 
			success:function(data) {
				_fillSelectFilter(data);
				if(cb && typeof(cb)==="function") {
					cb();
				}
			},
			error:function(){
				throw arguments;
			}
		});
	}
	function _fillSelectFilter(listParams){
		var selectChoice = 
			$('<select class="form-control selectFilter" name="cat-choice">');
		
		var curCat ;
		var currentCat = "";
		
		listParams.forEach(function(e){
			if(e.category!==currentCat) {
					curCat = $("<optgroup>");
					curCat.attr("label",e.category);
					curCat.appendTo(selectChoice);
					currentCat = e.category;
			}
			var opt = $("<option>");
			opt.val(e.path) ;
			opt.text(e.list_name) ;
			opt.data('listData',e);
			opt.appendTo(curCat);
		});
		
		selectChoice.appendTo(baseTpl.find('.list-choice label'));
	}

	function _load_all_time_slot() {
        $.ajax({
            url: params.urls.getFilters + '?' + params.queryParams, 
			success:function(data) {
				var list = data;
				_load_time_slot(list);
				},
			error:function(xqr,error,msg){
				alert('Error during TimeTable loading');
				throw arguments;
			}
		});
    }

	function getNewTableFormValues(){
		var form = baseTpl.find(".form-couleur"); 
		var res = {
			name:$.trim(form.find("input[name='zone_name']").val()),
			list_info:form.find("select[name='cat-choice'] option:selected").data("listData"),
			color: current_color
		};
		
		return res;
	}

	function checkNewTimeTable(tt) {
		if(!tt.name || tt.name.length < 4) {
			throw 'name is incorrect';
		}
		if(!tt.list_info) {
			throw 'category must be set';
		}
		if(!tt.color) {
			throw 'choose a color please';
		}
		if(
			(tt.eday < tt.sday) ||
		    (tt.eday === tt.sday && tt.ehour <= tt.shour)
		) {
			throw 'look at your time range';
		}
	}
	
	moment.weekdays().forEach(function(wd,i){
		var i = (i+6)%7;
		baseTpl.find('table thead th:eq(' +(i+1) +')').text(wd);
	});
	
    baseTpl.find(".form-couleur [type='checkbox']").click(function() {
        baseTpl.find(".form-couleur [type='checkbox']").each(function() {
            couleur[baseTpl.find(this).attr("name")] = baseTpl.find(this).is(':checked');
        });
        baseTpl.find(".bucket").css({
            "background-color": ht_color(couleur)
        });
    });
	
	//setying week days
	
	
    var zone_name_input = baseTpl.find(".form-couleur [name='zone_name']");
    zone_name_input.keyup(function() {
        if (zone_name_input.val() in areas) {
            zone_name_input.css({
                color: "red"
            });
        } else {
            zone_name_input.css({
                color: "black"
            });
        }
    });

    baseTpl.find(".form-couleur").submit(function(e) {
        e.preventDefault();
    });

	var btnSend = baseTpl.find('.row-valid button');
	btnSend.click(function () {
	    btnSend
			.attr('disabled', true)
			.find('i')
			.removeClass('fa-check')
			.addClass('fa-spinner fa-spin');

	    _sendDataToServer(function (success, message) {
	        var messageDisplayLength = 3000;
	        if (success) {
	            baseTpl
					.find('.row-valid .alert-success')
					.slideDown();
	        } else {
	            messageDisplayLength = 9000;
	            baseTpl
					.find('.row-valid .alert-danger')
					.slideDown();
	        }

	        btnSend
				.attr('disabled', false)
				.find('i')
				.removeClass('fa-spinner fa-spin')
				.addClass('fa-check');
	        setTimeout(function () {
	            baseTpl.find('.row-valid .alert').slideUp();
	        }, messageDisplayLength);
	    });

	});

   var onselect = function (event, ui) {
		var s = baseTpl.find(".ui-selected");
		var tt = {
			shour:49,
			ehour:0,
			sday:8,
			eday:0
		};

		for (var x = 0; x < s.length; x++) {
			var h = $(s[x]).data("hour");
			var d = $(s[x]).data("day");
			tt.shour = Math.min(h, tt.shour);
			tt.sday = Math.min(d, tt.sday);
			tt.ehour = Math.max(h, tt.ehour);
			tt.eday = Math.max(d, tt.eday);

			$(s[x]).removeClass("ui-selected");
		}
		
		//merging form and selectable data
		$.extend(tt,getNewTableFormValues());
		
		try {
			checkNewTimeTable(tt);
		} catch(e) {
			var fc = baseTpl.find(".form-couleur");
		    fc.addClass("highlighted");
			fc.find('.alert span').text(e);
			setTimeout(function () { fc.removeClass("highlighted"); }, 3000);
			throw e;
		}
		
		//ht_insert_area(tt);
		ht_insert_area(tt.shour, tt.sday, tt.ehour + 1, tt.eday + 1, tt.name, tt.list_info.category,tt.list_info.list_name, tt.color);
		on_time_slot_change();
		ht_list();

	};
	
	baseTpl.find(".selectable").selectable({ filter: "tr td:nth-child(n+2)", delay: 50, stop: onselect, distance: 7 });
	
	_loadFilterList(function(){
		_load_all_time_slot();
	});
	
	//to fix unknow error on local 
    var current_color;

    //on color choose
    baseTpl.find('area').click(function () {
		current_color = $(this).attr('alt');
		baseTpl.find(".bucket").css('background-color',current_color);
    });

    //randomly pick a color
    var $colorChooser = baseTpl.find('[name="colormap"]');
    var childNb =  Math.floor(Math.random()* $colorChooser.children().size());
    var $children = $colorChooser.children().eq(childNb);
    $children.trigger('click');
}
