/**
 * LBS Calendar 
 * Date: 2012-10-25
 * ====================================================================
 * opts.parent 日历插入到什么地方 默认body
 * opts.input 初始input对象 (要赋值时设置 实例化后可改变this.input)
 * opts.count 初始显示月份个数 默认1个
 * opts.year 初始年份 默认今年
 * opts.month 初始月份(1-12) 默认本月
 * opts.past 是否对今天以前的(天)可选 默认可选
 * opts.range 是否标选择范围 默认不标记 (多个input联动时使用)
 * opts.hover 是否标记移入状态(移入this.box中的天) 默认不标记 (多个input联动时使用)
 * opts.firstInput 标记选择范围时联动input中的第一个input对象 (多个input联动时使用)
 * opts.select 选择日期时执行函数 参数(target)是选择的日期对象 
 				日期对象有date属性 属性值为日期(如 2015-12-25)
 * ====================================================================
 * this.input input对象 要赋值时必须设置(重要) 
 * this.value 选择的要为this.input赋值的值(重要)
 * ====================================================================
 * this.box 日历容器对象
 * this.count 日历中月份显示的个数
 * this.year 日历年份
 * this.month 日历月份(1-12)
 * this.today 今天日期(如 2015-12-25)
 * this.startDate 联动input 选择范围 设置开始的值 (多个input联动时使用)
 * this.endDate 联动input 选择范围 设置结束的值 (多个input联动时使用)
 * this.draw() 方法 日历绘制 根据设置的this.year this.month重新绘制日历
 				(当年/月有改变时调用 更新显示内容)
 				(如果月没有改变直接调用 在当前显示最后月开始 加this.count个月) 
 * this.show() 方法 日历显示
 * this.hide() 方法 日历隐藏
 * this.setPosition(o) 设置定位 日历定位到o o默认为this.input
 * this.setValue(o) 设置赋值 把this.value赋值给o o默认为this.input
 * ====================================================================
 **/
;(function(exports) {
	'use strict';

	var LBS = (function() {
		var d = document,
			doc = d.documentElement,
			body = d.body;

		function getPosition(o) {
			var box = o.getBoundingClientRect(),
				doc = o.ownerDocument,
				body = doc.body,
				html = doc.documentElement,
				clientTop = html.clientTop || body.clientTop || 0,
				clientLeft = html.clientLeft || body.clientLeft || 0,
				x = box.left + (self.pageXOffset || html.scrollLeft || body.scrollLeft) - clientLeft,
				y = box.top + (self.pageYOffset || html.scrollTop || body.scrollTop) - clientTop;
			return {
				x: x,
				y: y
			};
		}

		function getScroll() {
			var x = doc.scrollLeft || body.scrollLeft,
				y = doc.scrollTop || body.scrollTop;
			if (d.compatMode != "CSS1Compat") {
				x = body.scrollLeft;
				y = body.scrollTop;
			}
			return {
				x: x,
				y: y
			};
		}

		function fixEvent(e) {
			if (e) return e;
			e = window.event;
			e.target = e.srcElement;
			e.pageX = e.clientX + getScroll().x;
			e.pageY = e.clientY + getScroll().y;
			e.stopPropagation = function() {
				e.cancelBubble = true;
			};
			e.preventDefault = function() {
				e.returnValue = false;
			};
			return e;
		}

		function addEvent(o, type, fn) {
			if (o.attachEvent) {
				o['e' + type + fn] = fn;
				o[type + fn] = function() {
					o['e' + type + fn].call(o, fixEvent());
				};
				o.attachEvent('on' + type, o[type + fn]);
			} else o.addEventListener(type, fn, false);
		}

		function create(el) {
			return d.createElement(el);
		}

		function format(s) {
			return parseInt(s) < 10 ? '0' + s : s;
		}

		function hasClass(o, c) {
			return -1 < (' ' + o.className + ' ').indexOf(' ' + c + ' ');
		}

		function addClass(o, c) {
			if (!hasClass(o, c)) o.className += ' ' + c;
		}

		function removeClass(o, c) {
			if (hasClass(o, c)) {
				var reg = new RegExp('(\\s|^)' + c + '(\\s|$)');
				o.className = o.className.replace(reg, '');
			}
		}

		return {
			getScroll: getScroll,
			getPosition: getPosition,
			format: format,
			create: create,
			on: addEvent,
			hasClass: hasClass,
			addClass: addClass,
			removeClass: removeClass
		};
	}());
	exports.Calendar = function() {
		this._init.apply(this, arguments);
	};
	Calendar.prototype = {
		_init: function(opts) {
			opts = opts || {};
			this.parent = opts.parent || document.getElementsByTagName('body')[0];
			this.count = opts.count || 1;

			this.past = opts.past === false ? false : true; //是否对今天以前的(天)可选 默认可选
			this.range = opts.range || false; //是否标选择范围 默认不标记
			this.hover = opts.hover || false; //是否标记移入状态 
			this.firstInput = opts.firstInput;

			this.year = parseInt(opts.year) || new Date().getFullYear();
			this.month = parseInt(opts.month) || new Date().getMonth() + 1; // (1-12)
			this.today = new Date().getFullYear() + '-' + LBS.format(new Date().getMonth() + 1) + '-' + LBS.format(new Date().getDate());

			this.select = opts.select || function() {};

			this.input = opts.input; //需赋值的input
			this.value = 0; //选择的值

			this.initDate = '1900-01-01';
			this.startDate = this.endDate = this.initDate;
		},
		_create: function() {
			if (!this.box) {
				this.exist = true;

				this.box = LBS.create('div');
				this.box.className = 'QBZ_calendar';

				this.prev = LBS.create('a');
				this.prev.className = 'QBZ_prev';
				this.prev.href = 'javascript:;';
				this.prev.innerHTML = '&lt;';
				this.box.appendChild(this.prev);

				this.next = LBS.create('a');
				this.next.className = 'QBZ_next';
				this.next.href = 'javascript:;';
				this.next.innerHTML = '&gt;';
				this.box.appendChild(this.next);

				this.content = LBS.create('div');
				this.content.className = 'QBZ_content';

				this._draw();

				this.box.appendChild(this.content);
				this.parent.appendChild(this.box);

				this._bind();
			}
			return this;
		},
		_draw: function() {
			for (var i = 0; i < this.count; i++) {
				this.month = this.month + (i ? 1 : 0);
				if (this.month > 12) {
					this.year++;
					this.month -= 12;
				}
				if (this.month < 1) {
					this.year--;
					this.month += 12;
				}
				this.content.appendChild(this._drawMonth(this.year, this.month));
			}
			return this;
		},
		_drawWeek: function() {
			var frag = document.createDocumentFragment(),
				weeks = '日一二三四五六'.split(''),
				week = null,
				i = 0,
				len = weeks.length;
			for (; i < len; i++) {
				week = LBS.create('div');
				week.className = 'QBZ_week';
				week.innerHTML = weeks[i];
				frag.appendChild(week);
			}
			return frag;
		},
		_darwDay: function(year, month) {
			var frag = document.createDocumentFragment(),
				firstDay = new Date(year, month - 1, 1).getDay(),
				lastDay = new Date(year, month, 0).getDate(),
				days = [],
				day = null,
				dayValue = 0,
				i = 0;

			var today_date = parseInt(this.today.replace(/-/g, '')),
				init_date = parseInt(this.initDate.replace(/-/g, '')),
				start_date = parseInt(this.startDate.replace(/-/g, '')),
				end_date = parseInt(this.endDate.replace(/-/g, '')),
				day_date = today_date;

			for (i = 0; i < firstDay; i++) days.push(0);
			for (i = 1; i <= lastDay; i++) days.push(i);
			for (i = 0; i < 42; i++) {
				day = LBS.create('a');
				day.href = 'javascript:;';
				dayValue = days.shift();

				if (!dayValue) {
					day.innerHTML = '&nbsp;';
					day.className = 'day_disabled';
				} else {
					day.date = year + '-' + LBS.format(month) + '-' + LBS.format(dayValue);
					day.innerHTML = dayValue;
					day.className = 'day_date';
					day_date = day.date.replace(/-/g, '');

					if (day_date == today_date) day.className += ' day_today';
					if (!this.past) day_date < today_date && (day.className = 'day_disabled');
					if (this.range) {
						day_date == start_date && (day.className += ' day_start');
						day_date == end_date && (day.className += ' day_end');
						// 日期范围条件: 结束值大于开始值 开始值不等于初始值 天的值大于开始值 天的值小于结束值 
						if (end_date > start_date && start_date != init_date && day_date > start_date && day_date < end_date) {
							day.className += ' day_range';
						}
					}
				}
				frag.appendChild(day);
			}
			return frag;
		},
		_drawMonth: function(year, month) {
			var dl = LBS.create('dl'),
				dt = LBS.create('dt'),
				dd = LBS.create('dd'),
				dt_time = LBS.create('div');

			dl.className = 'QBZ_dl';
			dt.className = 'QBZ_dt';
			dd.className = 'QBZ_dd';
			dt_time.className = 'QBZ_time';

			dt_time.innerHTML = year + '年' + month + '月';
			dt.appendChild(dt_time);
			dt.appendChild(this._drawWeek());

			dd.appendChild(this._darwDay(year, month));
			dl.appendChild(dt);
			dl.appendChild(dd);
			return dl;
		},
		_nextMonth: function() {
			this.month++;
			this.draw();
			return this;
		},
		_prevMonth: function() {
			this.month -= this.count * 2 - 1;
			this.draw();
			return this;
		},
		_bind: function() {
			var _this = this,
				initDate = this.initDate.replace('-', ''),
				startDate = initDate;
			LBS.on(this.box, 'click', function(e) {
				e.stopPropagation();
				if (!_this.status) return;
				var target = e.target;
				if (target.tagName.toUpperCase() === 'A' && target.className.indexOf('QBZ_prev') > -1) {
					_this._prevMonth();
				}
				if (target.tagName.toUpperCase() === 'A' && target.className.indexOf('QBZ_next') > -1) {
					_this._nextMonth();
				}
				if (target.tagName.toUpperCase() === 'A' && target.className.indexOf('day_date') > -1) {
					_this.hide();
					// _this.input.value = target.date;
					_this.value = target.date;
					_this.select && _this.select(target);
				}
			});
			LBS.on(document, 'click', function(e) {
				if (!_this.status) return;
				var target = e.target;
				if (_this.input && target !== _this.input) {
					_this.hide();
				}
			});
			if (this.range && this.hover) {
				LBS.on(this.box, 'mouseover', function(e) {
					e.stopPropagation();
					if (!_this.status) return;
					if (_this.firstInput && _this.input && _this.firstInput == _this.input) return;
					startDate = _this.startDate.replace('-', '');
					if (startDate == initDate) return;
					var target = e.target,
						els = _this.box.getElementsByTagName('a'),
						len = els.length,
						i = 0,
						s = -1,
						o = -1;
					if (target.tagName.toUpperCase() === 'A' && target.className.indexOf('day_date') > -1) {
						if (target.date.replace('-', '') < startDate) return;
						for (i = 0; i < len; i++) {
							if (LBS.hasClass(els[i], 'day_start')) s = i;
							if (els[i] == target) o = i;
							LBS.hasClass(els[i], 'day_hover') && LBS.removeClass(els[i], 'day_hover');
						}

						for (i = s + 1; i < o; i++) {
							if (!LBS.hasClass(els[i], 'day_hover') && !LBS.hasClass(els[i], 'day_disabled')) {
								els[i].className += ' day_hover';
							}
						}
					}
				});
			}
		},
		draw: function() {
			if (!this.exist) return this._create();
			this.content.innerHTML = '';
			this._draw();
			return this;
		},
		setPosition: function(o) {
			if (!this.exist) this._create();
			var o = o || this.input,
				x = LBS.getPosition(o).x,
				y = LBS.getPosition(o).y;
			this.box.style.left = x + 'px';
			this.box.style.top = y + o.offsetHeight + 'px';
			return this;
		},
		setValue: function(o) {
			var o = o || this.input;
			o.value = this.value;
			return this;
		},
		show: function() {
			this.status = true;
			if (!this.exist) this._create();
			this.box.style.display = 'block';
			return this;
		},
		hide: function() {
			this.status = false;
			this.box.style.display = 'none';
			return this;
		}
	};
}(window));