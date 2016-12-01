define(function(require){
	var Backbone = require('backbone'),
		_ = require('underscore'),
		$ = require('jquery'),
		tpl = require('text!./shopOrderTemplate.html');
	    Pagination = require('pagination'),
		BackboneDialog = require('backboneDialog'),
	    lookAtDialogTpl = require('text!modules/shop/shopOrderTemplate/lookAtDialog.html'),
		addDialogTpl = require('text!modules/shop/shopOrderTemplate/addDialog.html'),
		editDialogTpl = require('text!modules/shop/shopOrderTemplate/editDialog.html'),
		addGoodsDialogTpl = require('text!modules/shop/shopOrderTemplate/addGoodsDialog.html'),
		shopDetailListTableTpl ='<% _.each(tableData, function(goods,index){ %> ' +
				'<tr> ' +
				'<td><span><%= index+1 %></span></td> ' +
				'<td class="kc-supply-text-left"><span><%=goods.goodsCode%></span></td>' +
				'<td class="kc-supply-text-left"><span><%=goods.goodsName%></span></td>' +
				'<td class="kc-supply-text-left"><span><%=goods.goodsDesc%></span></td> ' +
				'<td class="kc-supply-text-left"><span><%=goods.orderUnit%></span></td> ' +
				'<td class="kc-supply-text-left remarkWidth"><span><%=goods.detailRemark%></span></td>' +
				'</tr> <% }); %>',
		shopGoodTemplateListTableTpl ='<% _.each(tableData, function(template,index){ %> ' +
				'<tr> ' +
				'<td><span><%= index+1 %></span></td> ' +
				'<td class="kc-supply-text-left"><span>' +
				'<a href="javascript:void(0);" class="operateType lookAt-msg authority" data-rightCode="chain.mendiandinghuomuban.query" hidden data-templateName= <%= template.templateName %> data-templateID = <%= template.templateID %> data-remark= <%= template.remark %> >查看</a>' +
			'<% if(template.demandType == 1) {%>'+
			'<a href="javascript:void(0);" class="operateType edit-msg authority" data-rightCode="chain.mendiandinghuomuban.update" hidden data-templateName= <%= template.templateName %> data-templateID = <%= template.templateID %> data-remark= <%= template.remark %> >编辑</a>' +
			'<a href="javascript:void(0);" class="del-modal authority" data-rightCode="chain.mendiandinghuomuban.delete" hidden data-templateID = <%= template.templateID %> >删除</a>' +
			'<%}%>'+
				'</span></td>'+
				'<td class="kc-supply-text-left"><span><%=template.templateName%></span></td>' +
				'<% var date = template.actionTime; var formate = "yyyy-MM-dd tt:ss";  var dateStr = formate.replace("yyyy", date.substring(0, 4)).replace("MM", date.substring(4, 6)).replace("dd",date.substring(6, 8)).replace("tt",date.substring(8, 10)).replace("ss",date.substring(10, 12)) %>'+
				'<td><span><%= dateStr%></span></td>'+
				'<td class="kc-supply-text-left"><span><%=template.actionBy%></span></td> ' +
				'<td class="kc-supply-text-left remarkWidth"><span><%=template.remark%></span></td>' +
				'</tr> <% }); %>';
	Suggest = require('suggest'),
		Tools = require('tools');


	var shopOrderTemplateView = Backbone.View.extend({
		className: 'shopOrderTemplate view kc-supply-container',
		template: _.template(tpl),
		wrapper: $('#page-wrapper'),
		options:{
			"groupID": "5",
			"demandID": "165772",
			"demandType": "1",
			"pageNo": "1",
			"pageSize": "20",
			"templateType": "1",
			"demandName":"动漫主题餐厅"
		},
		formOptions:{
			"chainGoodsTemplate": {},
			"templatedetails": [],
			"chainGoodsTemplateRelationlist":[]
		},
		events: {
			// 'click .edit': 'edit',
			'click .lookAt-msg': 'lookAtMsg',
			'click .shopOrder-add': 'shopOrderAdd',
			'click .del-modal': 'delModal',
			'click .edit-msg': 'editMsg',
			'keydown .pageViewNum': 'setPageViewNum',
			'click .search-button': 'queryByNameList',
			'keydown .special-input': 'searchTemplate',
			'focus .special-input':'searchTemplate',
			'click .removeSelected':'removeSelected',
		},
		initialize: function(){
			var me = this;
			me.render();
		},
		render: function(){
			var me = this;
			data = {
				"demandID": Tools.getCurrentOrgInfo().orgID,
				"templateType": "1",
				"demandType": "1"
			};
			Tools.Ajax('/basic/template/queryTemplateByDemandID', JSON.stringify(data), 'post', function(records){
				me.$el.html(me.template({records: records}));
				//权限控制authority
				Tools.authorityControl(me.$el);
				me.ajaxForData(me.options.demandID,me.options.demandID,me.options.demandType,me.options.templateType);
				me.scrollbarForTable();
				return me;
			});
		},
		scrollbarForTable: function(){
			var me = this;
			//系统名35px+选项卡35px+标题52px+标题下方voucherMessage高度50+标题下方灰色15px+table上padding各20px+页码40px
			var tableHeight = $(window).height()-247;
			var scrollTable = me.$el.find('.scrollPart');
			scrollTable.css('height',tableHeight);
			$(window).resize(function () {
				var tableHeight = $(window).height()-247;
				var scrollTable = me.$el.find('.scrollPart');
				scrollTable.css('height',tableHeight);
			});
		},
		ajaxForData: function(groupID,demandID,demandType,templateType){
			var me = this,
				data = {
					"demandID": me.options.demandID,
					"pageNo": me.options.pageNo,
					"pageSize": me.options.pageSize,
					"templateName":me.options.templateName,
					"templateType":me.options.templateType
				};
			Tools.Ajax('/basic/template/queryTemplateByDemandID', JSON.stringify(data), 'post', function(tableData, pageInfo){
				if(tableData.length > 0 ){
					me.$el.find(".no-data").hide();
					me.$el.find('.kc-supply-table tbody').html(_.template(shopGoodTemplateListTableTpl)({tableData: tableData}));
					//权限控制authority
					Tools.authorityControl(me.$el);
				}else{
					me.$el.find(".no-data").css("width","307px").show();
					me.$el.find('.kc-supply-table tbody').html("");
				}
                var suggestInitParas = {
                    "element": me.$el.find('.special-input'),
                    "url": "/basic/template/queryTemplateByDemandIDforSuggest",
                    "ajaxData": data,
					"effectiveFields": ["templateName","remark"],
					"effectiveFieldsAlias": {templateName: "模板名称",remark: "模板备注"},
                    "keyField": "templateName"
                };
                var bsSuggest = Tools.initSuggest(suggestInitParas);

                me.hasPagination = me.initPagination(pageInfo.pages, pageInfo.pageNum);
				me.$el.find('.total-number .num').html(pageInfo.total);
			});
		},
		initPagination: function(total, pageNum) {
			var me = this;
			me.$('#pagination-container').bootpag({
				total: total,          // total pages
				page: pageNum,            // default page
				maxVisible: 5,     // visible pagination
				leaps: true         // next/prev leaps through maxVisible
			}).off("page").on("page", function(event, num){
				me.options.pageNo = num;
				me.ajaxForData();
				me.$el.find('.choose-state').val(2);
			});
			return true;
		},
		setPageViewNum: function(e) {
			var me = this,
				meEl = $(e.currentTarget);
			if(e.keyCode == 13) {
				var pageSize = $.trim(meEl.val());
				if(pageSize) {
					me.options.pageSize = pageSize;
					me.ajaxForData();
				}
			}
			e.stopPropagation();
		},
		lookAtMsg:function(e) {
			var me = this,
				meEl = $(e.currentTarget),
				ajaxUrl = "/basic/template/templateDetail";
				data = {
					"templateID": meEl.data('templateid')
				};
			/*me.$el.find('.kc-supply-table lookAtTable tbody').html(_.template(shopDetailListTableTpl)({tableData: tableData}));
			 return me;*/
			var temaplateData={"name": meEl.data('templatename'),"remark":meEl.data('remark')};

			Tools.Ajax(ajaxUrl, JSON.stringify(data), 'post', function (tableData) {

				var lookAtDialog = BackboneDialog.extend({
					title: "订货模版查看",
					width:"10px",
					backdrop: 'static',
					/*body: lookAtDialogTpl,
					body: _.template(shopDetailListTableTpl)({tableData: tableData}),*/
					body: _.template(lookAtDialogTpl)({tableData: tableData,temaplateData:temaplateData}),
					buttons: [{
						className: 'button-cancel white-btn',
						label: '关闭',
						close: true,
						href: 'javascript:void(0)'
					}],
					events: {
						"click .modal-footer a.button-sure": "onOk",
						"click .modal-footer a.cancel": "onCancel",
						"hidden.bs.modal": "onHidden",
						"click .modal-body a.more": "moreDetials"
					},
					onOk: function(e) {
						this.$el.modal("hide");
						this.remove();
						e.stopPropagation();
					},
				});
				new lookAtDialog({
					width: '696px'
				}).render();
			});
		},
		shopOrderAdd:function(e){
			var groupID = this.options.groupID;
			var demandID = this.options.demandID;
			var demandType= this.options.demandType;
			var demandName=this.options.demandName;
			var me = this,
				meEl = $(e.currentTarget);
			var addMaterialDialog = BackboneDialog.extend({
				title: "新增订货模版",
				width:"10px",
				backdrop: 'static',
				body: addDialogTpl,
				buttons: [{
					className: 'button-cancel white-btn',
					label: '取消',
					close: true,
					href: 'javascript:void(0)'
				},{
					className: 'button-sure green-btn',
					label: '确定',
					href: 'javascript:void(0)'
				}],
				events: {
					"click .modal-footer a.button-sure": "onOk",
					"click .modal-footer a.cancel": "onCancel",
					"hidden.bs.modal": "onHidden",
					"click .modal-body a.more": "moreDetials",
					"click .addGoods-dialog": "addGoodsDialog",
					"click .minus":"minusline",
					"click .plus":"plusline",
					"click .uparrowDirection":"upline",
					"click .sort-down":"sortDown",
					"click .toparrowDirection":"sortTop",
					"click .bottomDirection":"sortbottom",
					'mouseover .dialog-table-style tbody tr': 'mouseoverTrHandle',
					'mouseout .dialog-table-style tbody tr': 'mouseoutTrHandle'
				},
				mouseoverTrHandle: function(e) {
					var me = this,
						meEl = $(e.currentTarget);
					meEl.find('td.goodsName').addClass("canEditTd");
					meEl.find('td.remark ').addClass("canEditTd");
				},
				mouseoutTrHandle: function(e) {
					var me = this,
						meEl = $(e.currentTarget);
					meEl.find('td.goodsName').removeClass("canEditTd");
					meEl.find('td.remark').removeClass("canEditTd");
				},
				/*增加一行*/
				plusline:function(e){
					var max_line_num = $("#distributionaddTemplate_table > tbody > tr:last-child").children("td").html();
					if (max_line_num == null) {
						max_line_num = 1;
					}
					else {
						max_line_num = parseInt(max_line_num);
						max_line_num += 1;
					}
					var line = "line_"+max_line_num;
					$('#distributionaddTemplate_table').append(
						'<tr id='+line+'>'+
						'<td class="tdData index" date_id=sortIndex>'+max_line_num+'</td>'+
						'<td width="77px" class="kc-supply-text-left">' +
						'<span class="addOrDelete-tr">' +
						'<a href="javascript:void(0);" class="plus" style="margin-right: 5px">新增</a> ' +
						'</span>' +
						'<span class="addOrDelete-tr">' +
						'<a href="javascript:void(0);" class="minus">删除</a>' +
						'</span>' +
						'</td>' +
						'<td class="tdData kc-supply-text-left" date_id="goodCode"></td>'+
						'<td class="tdData kc-supply-text-left editTemplateInputLine goodsName" style="padding: 0 " date_id="goodsName">'+
						'<div class="suggest-wrapper">'+
						'<div class="input-group">'+
						'<input type = "text"  class="editTemplateInput goodsName-input" >'+
						'<div class="input-group-btn">'+
						'<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>'+
						'</div>'+
						'</div>'+
						'</div>'+
						'</td>'+
						'<td class="tdData goodsDesc kc-supply-text-left" date_id="goodsDesc"></td>'+
						'<td class="tdData orderUnit kc-supply-text-left" date_id="orderUnit"></td>'+
						'<td class="tdData editTemplateInputLine remark kc-supply-text-left" style="padding: 0" date_id="remark"><input type = "text" class="editTemplateInput encoding-input"></td>'+
						'<td class="tdData goodsID kc-supply-text-left" date_id="goodsID"  style="display:none"></td>'+

						'<td class="arrowMove">'+
						'<span>'+
						'<a name="move" class="glyphicon glyphicon-arrow-up sort-top toparrowDirection" title="移到顶部" href="javascript:void(0);"></a> '+
						'<a name="move" class="glyphicon glyphicon-arrow-down sort-bottom bottomDirection" title="移到底部" href="javascript:void(0);"></a> '+
						'<a name="move" class="glyphicon glyphicon-arrow-up sort-up uparrowDirection" title="上移" href="javascript:void(0);"></a> '+
						'<a name="move" class="glyphicon glyphicon-arrow-down sort-down" title="下移" href="javascript:void(0);"></a> '+
						'</span>'+
						'</td>'+
						'</tr>'
					);
				},
				/*删除当前行*/
				minusline:function (e) {

					var currentStep=$(e.currentTarget).closest('tr').find(".index").html();
					var meEl = $(e.currentTarget),
						meTrEl = meEl.closest('tr'),
						meTbody = meTrEl.closest('tbody'),
						lastTrEl = meTbody.find(' >tr').last(),
						lastIndexEl = lastTrEl.find('.index'),
						lastIndexValue = parseInt(lastIndexEl.text());

					if(lastIndexValue == 1){
						$('tbody.dialogTable>tr').each(function(index,itme) {
							$(this).find('td').eq(2).html("");
							$(this).find('td:eq(3) input').val("");
							$(this).find('td.goodsDesc').html("");
							$(this).find('td.orderUnit').html("");
							$(this).find('td.remark input').val("");
						});
						return
					}
					$(".modal-body tr").each(function () {
						var seq = parseInt($(this).children("td").html());
						if (seq == currentStep) { $(this).remove(); }
						if (seq > currentStep) { $(this).children("td").each(function (i) { if (i == 0) $(this).html(seq - 1); }); }
					});
				},
				onOk: function(e) {
					var that = this;
					if(that.$body.find('.addmodalName').val() == "") {
						Tools.showTips("请添加模板名称");
						return;
					}
					if(!(that.$body.find('.goodsName-input').val())){
						Tools.showTips("客官，请输入已存在的品项");
						return;
					}
					/*templateID 如何获取*/
					var TemplateaddData = {
						"groupID":groupID,
						"demandID":demandID,
						"templateName": that.$body.find('.addmodalName').val(),
						"remark": that.$body.find('.addmodalRemark').val(),
						"demandType":demandType,
						"templateType":me.options.templateType,
						"actionBy":"lu"
					};
					me.formOptions.chainGoodsTemplate=TemplateaddData;
					/*将table转成json*/
       				var DemandData={
						"demandID":demandID,
						"demandName":demandName
					};
					me.formOptions.chainGoodsTemplateRelationlist.push(DemandData);
					var tableSelector = $('#distributionaddTemplate_table tbody'), _LIST = [];
					if (typeof(tableSelector) !== 'object') {
						return new Error('Invalid tableSelector!');
					};
					var max_line_num = $("#distributionaddTemplate_table > tbody > tr:last-child").children("td").html();
					if (max_line_num == 1) {
						var goodsName;
						$('tbody.dialogTable>tr').each(function(index,itme) {
							 goodsName = $(this).find('td:eq(3) input').val();//$(this).find('td').eq(3).html();
						});
						if(goodsName == ""){
							Tools.showTips("至少添加一个品项");
							return;
						}
					}
					var dialogtrsSave=$('tbody.dialogTable>tr');
					_.each(dialogtrsSave, function(item){
						var goodName = $(item).find(".goodsName-input").val();
						if(!goodName) {
							$(item).remove();
						}
					});

					$('tbody.dialogTable>tr').each(function(index,itme) {
						var Templatelist={};
						var sortIndex = $(this).find('td').eq(0).html();
						var goodsCode = $(this).find('td').eq(2).html();
						var goodsName = $(this).find('td:eq(3) input').val();//$(this).find('td').eq(3).html();
						var goodsDesc = $(this).find('td.goodsDesc').html();
						var orderUnit = $(this).find('td.orderUnit').html();
						var remark = $(this).find('td.remark input').val()
						var goodsID = $(this).find('td.goodsID').html();
						Templatelist['sortIndex']=sortIndex;
						Templatelist['goodsCode']=goodsCode;
						Templatelist['goodsName']=goodsName;
						Templatelist['goodsDesc']=goodsDesc;
						Templatelist['orderUnit']=orderUnit;
						Templatelist['remark']=remark;
						Templatelist['goodsID']=goodsID;
						_LIST.push(Templatelist);
					});

					console.log(_LIST);
					if(_LIST.length == 0){
						Tools.showTips("至少添加一个品项");
						$('#distributionaddTemplate_table').append(
							'<tr id="line_1">'+
							'<td class="tdData index" date_id=sortIndex>1</td>'+
							'<td class="tdData kc-supply-text-left">' +
							'<span class="addOrDelete-tr">' +
							'<a href="javascript: void(0);" class="plus">新增</a> ' +
							'</span>' +
							'<span class="addOrDelete-tr">' +
							'<a href="javascript: void(0);" class="minus">删除</a>' +
							'</span>' +
							'</td>'+
							'<td class="tdData goodCode kc-supply-text-left" date_id="goodCode"></td>'+
							'</td>'+
							'<td class="tdData kc-supply-text-left editTemplateInputLine" date_id="goodsName">'+
							'<div class="suggest-wrapper">'+
							'<div class="input-group">'+
							'<input type = "text"  class="editTemplateInput noPadding-inputWidth goodsName-input" >'+
							'<div class="input-group-btn">'+
							'<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>'+
							'</div>'+
							'</div>'+
							'</div>'+
							'</td>'+
							'<td class="tdData goodsDesc kc-supply-text-left" date_id="goodsDesc"></td>'+
							'<td class="tdData orderUnit kc-supply-text-left" date_id="orderUnit"></td>'+
							'<td class="tdData editTemplateInputLine remark kc-supply-text-left" date_id="remark"><input type = "text" class="editTemplateInput noPadding-inputWidth"></td>'+
							'<td class="tdData goodsID" date_id="goodsID kc-supply-text-left"  style="display:none"></td>'+
							'<td class="arrowMove">'+
							'<span>'+
							'<a name="move" class="glyphicon glyphicon-arrow-up sort-top toparrowDirection" title="移到顶部" href="javascript:void(0);"></a> '+
							'<a name="move" class="glyphicon glyphicon-arrow-down sort-bottom bottomDirection" title="移到底部" href="javascript:void(0);"></a> '+
							'<a name="move" class="glyphicon glyphicon-arrow-up sort-up uparrowDirection" title="上移" href="javascript:void(0);"></a> '+
							'<a name="move" class="glyphicon glyphicon-arrow-down sort-down" title="下移" href="javascript:void(0);"></a> '+
							'</span>'+
							'</td>'+
							'</tr>'
						);
						return;
					}
					me.formOptions.templatedetails=_LIST;
					Tools.Ajax('/basic/template/saveTemplate', JSON.stringify(me.formOptions), 'post', function(){
						that.$el.modal("hide");
						that.remove();
						Tools.showTips('新增订货模板成功!',"success");
						me.render();
					});
					e.stopPropagation();
				},
				//选择品项弹出框
				addGoodsDialog:function(e){
					var that = this,
						meEl = $(e.currentTarget);
					categorydata = {
						"groupID":groupID,
						"flag":"1"
					};
					Tools.Ajax('/basic/goodsCategory/queryAll', JSON.stringify(categorydata), 'post', function(typeArray){
						var addGoodsDialog = BackboneDialog.extend({
							title: "选择品项",
							body: _.template(addGoodsDialogTpl)({typeArray: typeArray}),
							backdrop: 'static',
							buttons: [{
								className: 'button-cancel white-btn',
								label: '取消',
								close: true,
								href: 'javascript:void(0)'
							},{
								className: 'button-sure green-btn',
								label: '确定',
								href: 'javascript:void(0)'

							}],
							events: {
								"hidden.bs.modal": "onHidden",
								"click .modal-footer a.button-sure": "onSure",
								'click .applicable-organization':'applicableOrganization',
								'click .kc-supply-menu .group-first .content': 'clickPlusOrMinusIcon',
								'click .kc-supply-menu .selectCategoryName': 'selectCheckedAllLeft',
								'click .dialog-addMaterials .move-right': 'moveRight',
								'click  .dialog-table-style .checkedAll-materials': 'selectCheckedAllRight',
								'click  .dialog-table-style .selectgoods': 'selectSameGoods',
								'click .dialog-right-materials .delete-selected': 'deleteSelected'
							},
							onSure: function(e) {
								debugger;
								var thatDialog = this;
								// this
								var addNewOrderTrs =$("#distributionaddTemplate_table > tbody > tr");
								// 元素选择
								var goodsStepTableTrs = $(".goodsStepTable > tbody > tr")
								//去除"品项名称"为空的tr
								_.each(addNewOrderTrs, function(item){
									var goodName = $(item).find(".goodsName-input").val();
									if(!goodName) {
										$(item).remove();
									}
								});
								if(goodsStepTableTrs.length == 0){
									Tools.showTips("请先选择品项");
									return;
								}
								thatDialog.$el.find('table.goodsStepTable tbody tr').each(function(){
									var goodsID  =	$(this).data("goodsid"),
										goodsCode =$(this).data("goodscode"),
										unit =$(this).data("unit"),
										goodsName = $(this).find('td').eq(3).html(),
										goodsDesc = $(this).find('td').eq(4).html(),
										status = $(this).find('td').eq(6).html();
									var max_line_num = $("#distributionaddTemplate_table > tbody > tr:last-child").children("td").html();
									if (max_line_num == null) {
										max_line_num = 1;
									}
									else {
										max_line_num = parseInt(max_line_num);
										max_line_num += 1;
									}
									var line = "line_"+max_line_num;
									that.$body.find(".dialogTable tbody").append(
										'<tr id='+line+'>'+
										'<td class="tdData index" date_id=sortIndex>'+max_line_num+'</td>'+
										'<td class="tdData kc-supply-text-left">' +
										'<span class="addOrDelete-tr">' +
										'<a href="javascript: void(0);" class="plus">新增</a> ' +
										'</span>' +
										'<span class="addOrDelete-tr">' +
										'<a href="javascript: void(0);" class="minus">删除</a>' +
										'</span>' +
										'</td>'+
										'<td class="tdData" date_id="goodCode">'+goodsCode+'</td>'+
										'<td class="tdData kc-supply-text-left editTemplateInputLine goodsName" style="padding: 0 " date_id="goodsName">'+
										'<div class="suggest-wrapper">'+
										'<div class="input-group">'+
										'<input type = "text" value='+goodsName+' class="editTemplateInput goodsName-input editTemplateIndexGoodsName" >'+
										'<div class="input-group-btn">'+
										'<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>'+
										'</div>'+
										'</div>'+
										'</div>'+
										'</td>'+
										'<td class="tdData goodsDesc" date_id="goodsDesc">'+goodsDesc+'</td>'+
										'<td class="tdData orderUnit" date_id="orderUnit">'+unit+'</td>'+
										'<td class="tdData editTemplateInputLine remark"  style="padding: 0" date_id="remark"><input type ="text" class="editTemplateInput encoding-input"></td>'+
										'<td class="tdData goodsID" date_id="goodsID"  style="display:none">'+goodsID+'</td>'+
										'<td class="arrowMove">'+
										'<span>'+
										'<a name="move" class="glyphicon glyphicon-arrow-up sort-top toparrowDirection" title="移到顶部" href="javascript:void(0);"></a> '+
										'<a name="move" class="glyphicon glyphicon-arrow-down sort-bottom bottomDirection" title="移到底部" href="javascript:void(0);"></a> '+
										'<a name="move" class="glyphicon glyphicon-arrow-up sort-up uparrowDirection" title="上移" href="javascript:void(0);"></a> '+
										'<a name="move" class="glyphicon glyphicon-arrow-down sort-down" title="下移" href="javascript:void(0);"></a> '+
										'</span>'+
										'</td>'+
										'</tr>');
								});
								_.each($("#distributionaddTemplate_table > tbody > tr"), function(item, index){
									$(item).attr('index', index + 1);
									$(item).find('td').eq(0).text(index + 1);
								});

								thatDialog.$el.modal("hide");
								thatDialog.remove();

								e.stopPropagation();

							},
							//全选框
							clickPlusOrMinusIcon: function(e){
								var me = this,
									meEl = $(e.currentTarget);

								if(meEl.closest('li').find('ul.types').length == 0) {
									return;
								}
								if(meEl.children().children().hasClass('drop-up-icon')){// +
									meEl.children().children().removeClass('drop-up-icon').addClass('drop-down-icon');
								}else {// -
									meEl.children().children().removeClass('drop-down-icon').addClass('drop-up-icon');
								}
								meEl.closest('li').find('ul.types').eq(0).toggle();
								e.stopPropagation();
							},
							//右侧全选
							selectCheckedAllLeft: function(e) {
								var me = this,
									meEl = $(e.currentTarget);
								if(meEl.prop("checked")) {
									meEl.closest("li").find("input.selectCategoryName").prop("checked",true);
									meEl.closest("li").find("input.selectGoodsName").prop("checked",true);
									meEl.closest("li").find("input.selectGoodsName:disabled").prop("checked",false);
								}else {
									meEl.closest("li").find("input.selectCategoryName").prop("checked",false);
									meEl.closest("li").find("input.selectGoodsName").prop("checked",false);
								}
								e.stopPropagation();
							},
							//移动到右侧
							moveRight: function(e) {
								var me = this,
									meEl = $(e.currentTarget);
									// me是this,this指代
								me.$body.find('.dialog-left-content input[class="selectGoodsName"]:checked').each(function(index,item){
									var goodsName = $(this).closest("li").data("goodsname"),
										goodsCode = $(this).closest("li").data("goodscode"),
										goodsID = $(this).closest("li").data("goodsid"),
										goodsDesc = $(this).closest("li").data("goodsdesc"),
										isActive = $(this).closest("li").data("isactive"),
										unit = $(this).closest("li").data("unit");
									me.$body.find(".dialog-table-style").append(
										'<tr data-goodsID='+goodsID+' data-goodsCode='+goodsCode+'' +
										' data-unit='+unit +'>'+
										'<td></td>'+
										'<td><input type="checkbox" name="goodsChecks" class="selectgoods" checked></td>'+
										'<td>'+goodsCode+'</td>'+
										'<td class="kc-supply-text-left">'+goodsName+'</td>'+
										'<td>'+goodsDesc+'</td>'+
										'<td>'+unit+'</td>'+
										'<td>'+Tools.getStaticOptions("isActive",isActive)+'</td>'+
										'</tr>');
									console.log(goodsName);
									e.stopPropagation();
								});
								me.$body.find('.dialog-table-style>tbody>tr').each(function(index,item){
									$(this).find('td').eq(0).html(index+1);
								});
								//左侧已经移动的不可勾选
								me.$body.find('input.selectGoodsName:checked').attr({"checked":false}).attr({"disabled":true});
								me.$body.find('input.selectCategoryName:checked').attr({"checked":false});
							},
							//右侧全选
							selectCheckedAllRight: function(e) {
								var me = this,
									meEl = $(e.currentTarget);
								if(meEl.prop("checked")) {
									meEl.closest("table").find("input[type=checkbox]").prop("checked",true);
								}else {
									meEl.closest("table").find("input[type=checkbox]").prop("checked",false);
								}
								e.stopPropagation();
							},
							//右侧选中一种品相
							selectSameGoods:function(e) {
								var me = this,
									meEl = $(e.currentTarget);
								if(meEl.prop("checked")){
									meEl.closest(".dialog-table-style").find("tr").each(function(){
										if($(this).data("goodsid")==meEl.closest("tr").data("goodsid")){
											$(this).find("input[type=checkbox]").prop("checked",true);
										}
									});
								}else{
									meEl.closest(".dialog-table-style").find("tr").each(function(){
										if($(this).data("goodsid")==meEl.closest("tr").data("goodsid")){
											$(this).find("input[type=checkbox]").prop("checked",false);
										}
									});
								}

								e.stopPropagation();
							},
							//删除右侧被选中的品相
							deleteSelected: function(e) {
								var me = this,
									meEl = $(e.currentTarget);
								me.$body.find('.dialog-rightContent input.selectgoods:checked').each(function(){
									var goodsID = $(this).closest("tr").data("goodsid");
									me.$body.find('.dialog-left-content input[type="checkbox"]:disabled').each(function() {
										if($(this).closest("li").data("goodsid") == goodsID){
											$(this).removeAttr("disabled");
										}
									});
								});
								me.$body.find('.dialog-rightContent td input[name="goodsChecks"]:checked').closest('tr').remove();
								me.$body.find('.dialog-rightContent th .checkedAll-materials').prop("checked", false);

								//给表格加序号
								me.$body.find('.dialog-table-style>tbody>tr').each(function(index,item){
									$(this).find('td').eq(0).html(index+1);
								});

								e.stopPropagation();

							},
							//选择适用组织
							applicableOrganization: function(e) {
								var me = this,
									meEl = $(e.currentTarget);
								var	data = {
									"groupID":that.options.groupID,
									"isActive":"1",
									"distributionID":that.options.demandID
								};
								Tools.Ajax('/basic/organization/getShopAndHouse', JSON.stringify(data), 'post', function(warehouseData){
									var applicableOrganizationDialog = BackboneDialog.extend({
										title: "选择适用门店",
										width:"10px",
										backdrop: 'static',
										body: _.template(applicableOrganizationTpl)({houseArray:  [] || warehouseData[0].list , shopArray: [] || warehouseData[1].list}),
										backdrop: 'static',
										buttons: [{
											className: 'button-cancel white-btn',
											label: '取消',
											close: true,
											href: 'javascript:void(0)'
										},{
											className: 'button-sure green-btn',
											label: '确定',
											href: 'javascript:void(0)'
										}],
										events: {
											"click .modal-body .toggle-warehouse": "warehouseToggle",
											"click .modal-body .warehouse-checkedAll-left": "warehouseCheckedAllLeft",
											"click .modal-body .shop-checkedAll-left": "shopCheckedAllLeft",
											"click .modal-body .warehouse-checkedAll-right": "warehouseCheckedAllRight",
											"click .modal-body .shop-checkedAll-right": "shopCheckedAllRight",
											"click .modal-body .delete-selected": "deleteSelected",
											"click .modal-body .add-organization": "moveRight",
											"click .modal-footer a.button-sure": "onOk",
											"hidden.bs.modal": "onHidden"
										},
										warehouseToggle: function(e){
											var me = this,
												meEl = $(e.currentTarget),
												iconEl = meEl.find('.drop-icon');
											if(iconEl.hasClass('drop-down-icon')) {
												iconEl.removeClass('drop-down-icon').addClass('drop-up-icon');
											}else {
												iconEl.removeClass('drop-up-icon').addClass('drop-down-icon');
											}
											meEl.siblings('.warehouseList-left').toggle();
											e.stopPropagation();
										},
										warehouseCheckedAllLeft: function(e){
											var me = this,
												meEl = $(e.currentTarget),
												warehouseListLeftEl = me.$body.find('.warehouseList-left input[type="checkbox"]'),
												warehouseListLeftElnone = me.$body.find('.warehouseList-left input[type="checkbox"]:disabled');
											if(meEl.prop("checked")) {
												warehouseListLeftEl.prop("checked",true);
												warehouseListLeftElnone.prop("checked",false);
											}else {
												warehouseListLeftEl.prop("checked",false);
											}
											e.stopPropagation();
										},
										shopCheckedAllLeft: function(e) {
											var me = this,
												meEl = $(e.currentTarget),
												shopListLeftEl = me.$body.find('.shopList-left input[type="checkbox"]'),
												shopListLeftElnone = me.$body.find('.shopList-left input[type="checkbox"]:disabled');
											if(meEl.prop("checked")) {
												shopListLeftEl.prop("checked",true);
												shopListLeftElnone.prop("checked",false);
											}else {
												shopListLeftEl.prop("checked",false);
											}
											e.stopPropagation();
										},
										warehouseCheckedAllRight: function(e){
											var me = this,
												meEl = $(e.currentTarget),
												warehouseListLeftEl = me.$body.find('.warehouseList-right input[type="checkbox"]');
											if(meEl.prop("checked")) {
												warehouseListLeftEl.prop("checked",true);
											}else {
												warehouseListLeftEl.prop("checked",false);
											}
											e.stopPropagation();
										},
										shopCheckedAllRight: function(e) {
											var me = this,
												meEl = $(e.currentTarget),
												shopListLeftEl = me.$body.find('.shopList-right input[type="checkbox"]');
											if(meEl.prop("checked")) {
												shopListLeftEl.prop("checked",true);
											}else {
												shopListLeftEl.prop("checked",false);
											}
											e.stopPropagation();
										},
										deleteSelected: function(e) {
											var me = this;
											me.$body.find('.warehouseList-right input[type="checkbox"]:checked').each(function(){
												var demandID = $(this).closest("li").attr("demandID");
												me.$body.find('.warehouseList-left input[type="checkbox"]:disabled').each(function() {
													if($(this).closest("li").attr("demandID") == demandID){
														$(this).removeAttr("disabled");
													}
												});
											});
											me.$body.find('.shopList-right input[type="checkbox"]:checked').each(function(){
												var demandID = $(this).closest("li").attr("demandID");
												me.$body.find('.shopList-left input[type="checkbox"]:disabled').each(function() {
													if($(this).closest("li").attr("demandID") == demandID){
														$(this).removeAttr("disabled");
													}
												});
											});
											me.$body.find('.warehouseList-right input[type="checkbox"]:checked').closest('li').remove();
											me.$body.find('.shopList-right input[type="checkbox"]:checked').closest('li').remove();
											me.$body.find('.warehouse-checkedAll-right').prop("checked", false);
											me.$body.find('.shop-checkedAll-right').prop("checked", false);
											e.stopPropagation();
										},
										moveRight: function(e) {
											var me = this;
											var warehouseList = me.$body.find('.warehouseList-left input[type="checkbox"]:checked').closest('li'),
												warehouseListClone = warehouseList.clone(),
												shopList = me.$body.find('.shopList-left input[type="checkbox"]:checked').closest('li'),
												shopListClone = shopList.clone();
											me.$body.find('.warehouseList-right').append(warehouseListClone);
											me.$body.find('.shopList-right').append(shopListClone);
											//右侧去掉选中状态
											me.$body.find('.warehouseList-right input[type="checkbox"]').prop("checked", false);
											me.$body.find('.shopList-right input[type="checkbox"]').prop("checked", false);
											//左侧已经移动的不可勾选
											me.$body.find('.warehouseList-left input[type="checkbox"]:checked').attr({"checked":false}).attr({"disabled":true});
											me.$body.find('.shopList-left input[type="checkbox"]:checked').attr({"checked":false}).attr({"disabled":true});
											//去除左侧全选的选中状态
											me.$body.find('.warehouse-checkedAll-left').prop("checked", false);
											me.$body.find('.shop-checkedAll-left').prop("checked", false);
										},
										onOk:function (e) {

											that.shopList= [];
											var me = this,
												liList = me.$body.find('.dialog-right-content .dialog-second-ul input[type="checkbox"]').closest('li');
											if(liList.length == 0) {
												Tools.showTips("请先选择门店");
												return;
											}
											_.each(liList, function(item){
												var shopItem = {
													"shopID": $(item).attr('demandid'),
													"shopName": $(item).attr('demandname')
												}
												that.shopList.push(shopItem);
											});
											meEl.data("shopList",that.shopList)
											me.$el.modal("hide");
											me.remove();
											e.stopPropagation();
										}
									});
									var applicableOrganizationDialogInstance = new applicableOrganizationDialog({
										width: '540px'
									}).render();
									//choose绑定数据
									var concatData = warehouseData[0].list.concat(warehouseData[1].list);
									_.each(concatData, function(item) {
										item.orgMnemonicCode = item.orgMnemonicCode.toLowerCase();
									});
									applicableOrganizationDialogInstance.$body.find('#choson-warehouse').chosen({
										data: concatData,
										valField: 'demandID',
										txtField: 'demandName',
										pyField: 'orgMnemonicCode'
									}).on('change', function(){ // change 事件就是 <select> 的 change 事件
										applicableOrganizationDialogInstance.$body.find('.warehouseList-left').show();
										applicableOrganizationDialogInstance.$body.find('.dialog-left-content').find('input[type="checkbox"]').each(function(){
											$(this).prop('checked', false);
										});
										if(!applicableOrganizationDialogInstance.$body.find('.dialog-left-content ul li[demandID="'+this.value+'"]').addClass('active').show().find('input[type="checkbox"]').prop("disabled")){
											applicableOrganizationDialogInstance.$body.find('.dialog-left-content ul li[demandID="'+this.value+'"]').find('input[type="checkbox"]').prop('checked', true);
										};

									});
								});
								e.stopPropagation();
							}
						});
						var addGoodsDialogInstance = new addGoodsDialog({
							width: '856px'
						}).render();
						//choose绑定数据
						var concatData=[];
						for(var i=0;i<typeArray.length;i++){
							var sub = typeArray[i].childs
							for(var j=0;j<sub.length;j++ ){
								var subItem = sub[j].childs
								for(var k=0;k<subItem.length;k++){
									concatData = concatData.concat(subItem[k].goodsList);
								}
							}
						}
						_.each(concatData, function(item) {
							item.goodsMnemonicCode = item.goodsMnemonicCode.toLowerCase();
						});
						addGoodsDialogInstance.$body.find('#chooson-category').chosen({
							data: concatData,
							valField: 'goodsID',
							txtField: 'goodsName',
							pyField: 'goodsMnemonicCode',
							width: '220px'
						}).on('change', function(){ // change 事件就是 <select> 的 change 事件
							addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').closest('ul.group-second').show();
							addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').closest('ul.group-third').show();
							addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').closest('ul').show();
							addGoodsDialogInstance.$body.find('.dialog-left-content').find('input[type="checkbox"]').each(function(){
								$(this).prop('checked', false);
							});
							if(!addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').addClass('active').show().find('input[type="checkbox"]').prop('disabled')){
								addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').find('input[type="checkbox"]').prop('checked', true)
							};
						});
					});

				},
				/*置底*/
				sortbottom:function (e) {
					var meEl = $(e.currentTarget),
						meTrEl = meEl.closest('tr'),
						meTbody = meTrEl.closest('tbody'),
						lastTrEl = meTbody.find(' > tr').last(),
						meIndexEl = meTrEl.find('.index'),
						lastIndexEl = lastTrEl.find('.index'),
						meIndexValue = parseInt(meIndexEl.text()),
						lastIndexValue = parseInt(lastIndexEl.text());

					if(meIndexValue != lastIndexValue) {
						meTrEl.insertAfter(lastTrEl);
					}
					_.each(meTbody.find('>tr'), function(tr, index) {
						$(tr).find('.index').text(index + 1);
					});
				},
				/*置顶*/
				sortTop:function (e) {
					var meEl = $(e.currentTarget),
						meTrEl = meEl.closest('tr'),
						meTbody = meTrEl.closest('tbody'),
						firstTrEl = meTrEl.closest('tbody').find('tr').first(),
						meIndexEl = meTrEl.find('.index'),
						firstIndexEl = firstTrEl.find('.index'),
						meIndexValue = parseInt(meIndexEl.text()),
						firstIndexValue = parseInt(firstIndexEl.text());

					if(meIndexValue != firstIndexValue) {
						meTrEl.insertBefore(firstTrEl);
					}
					_.each(meTbody.find('>tr'), function(tr, index) {
						$(tr).find('.index').text(index + 1);
					});

				},

				/*下移*/
				sortDown:function (e) {
					var meEl = $(e.currentTarget),
						meTrEl = meEl.closest('tr'),
						nextTrEl = meTrEl.next(),
						meIndexEl = meTrEl.find('.index'),
						nextIndexEl = nextTrEl.find('.index'),
						meIndexValue = parseInt(meIndexEl.text()),
						nextIndexValue = parseInt(nextIndexEl.text());

					if(nextTrEl.length) {
						meIndexEl.text(nextIndexValue);
						nextIndexEl.text(meIndexValue);
						meTrEl.insertAfter(nextTrEl);
					}
				},
				/*上移*/
				upline:function(e){
					var meEl = $(e.currentTarget),
						meTrEl = meEl.closest('tr'),
						beforeTrEl = meTrEl.prev(),
						meIndexEl = meTrEl.find('.index'),
						beforeIndexEl = beforeTrEl.find('.index'),
						meIndexValue = parseInt(meIndexEl.text()),
						beforeIndexValue = parseInt(beforeIndexEl.text());

					if(beforeTrEl.length) {
						meIndexEl.text(beforeIndexValue);
						beforeIndexEl.text(meIndexValue);
						meTrEl.insertBefore(beforeTrEl);
					}

				},

			});
			new addMaterialDialog({
				width: '878px'
			}).render();
			$("#distributionaddTemplate_table").on('focus','.goodsName-input',function(){
				var suggestInitParas = {
					"element": $(this),
					"url": "/basic/distributionGoods/queryShopGoodsBySearchKey",
					"ajaxData": {
						"groupID": 5,
						//"distributionID": 1000,
						//"demandID": 165708,
						"pageSize":"-1",
						"searchKey": ""
					},
					"effectiveFields": ["goodsCode", "goodsName", "standardUnit", "goodsDesc", "goodsMnemonicCode"],
					"effectiveFieldsAlias": {goodsCode: "编码", goodsName: "名称", standardUnit: "标准单位", goodsDesc: "规格", goodsMnemonicCode: "缩写"},
					"keyField": "goodsName",
					"minWidth": "400px",
					"top": "0",
				};
				var bsSuggest = Tools.initSuggest(suggestInitParas);
				bsSuggest.on('onSetSelectValue', function (e, keyword, data) {
					var meEl = $(e.currentTarget);
					var $tr = meEl.closest('tr');
					$tr.find('td').eq(2).html(data.goodsCode);
					$tr.find('td.goodsCode').html(data.goodsCode);
					$tr.find('td.goodsDesc').html(data.goodsDesc);
					$tr.find('td.orderUnit').html(data.orderUnit);
					$tr.find('td.goodsID').html(data.goodsID);
				});
			});
		},
		editMsg:function(e){
			var demandID = this.options.demandID;
			var demandName=this.options.demandName;
			var groupID = this.options.groupID;
			var me = this,
				meEl = $(e.currentTarget),
				ajaxUrl = "/basic/template/templateDetail";
			data = {
				"templateID": meEl.data('templateid')
			};
			var temaplateData={"name": meEl.data('templatename'),"remark":meEl.data('remark'),"templateID": meEl.data('templateid')};
			Tools.Ajax(ajaxUrl, JSON.stringify(data), 'post', function (tableData){
				var editDialog = BackboneDialog.extend({
					title: "编辑订货模版",
					width:"10px",
					backdrop: 'static',
					body: _.template(editDialogTpl)({tableData: tableData,temaplateData:temaplateData}),
					buttons: [{
						className: 'button-cancel white-btn',
						label: '取消',
						close: true,
						href: 'javascript:void(0)'
					},{
						className: 'button-sure green-btn',
						label: '确定',
						href: 'javascript:void(0)'
					}],
					events: {
						"click .modal-footer a.button-sure": "onmodifyOk",
						"click .modal-footer a.cancel": "onCancel",
						"hidden.bs.modal": "onHidden",
						"click .modal-body a.more": "moreDetials",
						"click .uparrowDirection":"upline",
						"click .sort-down":"sortDown",
						"click .toparrowDirection":"sortTop",
						"click .bottomDirection":"sortbottom",
						"click .shopAddBtn":"shopAdd",
						"click .plus":"plus",
						"click .minus":"minusline",
						'mouseover .dialog-table-style tbody tr': 'mouseoverTrHandle',
						'mouseout .dialog-table-style tbody tr': 'mouseoutTrHandle'
					},
					mouseoverTrHandle: function(e) {
						var me = this,
							meEl = $(e.currentTarget);
						meEl.find('td.goodsName').addClass("canEditTd");
						meEl.find('td.remark ').addClass("canEditTd");

					},
					mouseoutTrHandle: function(e) {
						var me = this,
							meEl = $(e.currentTarget);
						meEl.find('td.goodsName').removeClass("canEditTd");
						meEl.find('td.remark').removeClass("canEditTd");
					},

					//添加一行
					plus:function(e){
						var meEl = $(e.currentTarget),
							meTrEl = meEl.closest('tr'),
							meTbody = meTrEl.closest('tbody'),
							lastTrEl = meTbody.find(' > tr').last(),
							lastIndexEl = lastTrEl.find('.index'),
							lastIndexValue = parseInt(lastIndexEl.text());
						if(isNaN(lastIndexValue)){
							lastIndexValue=1
						}
						var max_line_num = lastIndexValue +1;
						var line = "line_"+max_line_num;
						$('#template_table').append(
							'<tr id='+line+'>'+
							'<td class="tdData index" date_id=sortIndex>'+max_line_num+'</td>'+
								'<td width="77px" class="kc-supply-text-left">' +
							'<span class="addOrDelete-tr">' +
							'<a href="javascript:void(0);" class="plus" style="margin-right: 5px">新增</a> ' +
							'</span>' +
							'<span class="addOrDelete-tr">' +
							'<a href="javascript:void(0);" class="minus">删除</a>' +
							'</span>' +
							'</td>' +
						'<td class="tdData goodCode" date_id="goodCode"></td>'+
						'<td class="tdData kc-supply-text-left editTemplateInputLine goodsName" style="padding: 0 " date_id="goodsName">'+
						'<div class="suggest-wrapper">'+
						'<div class="input-group">'+
						'<input type = "text"  class="editTemplateInput goodsName-input" >'+
						'<div class="input-group-btn">'+
						'<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>'+
						'</div>'+
						'</div>'+
						'</div>'+
						'</td>'+
						'<td class="tdData goodsDesc" date_id="goodsDesc"></td>'+
						'<td class="tdData orderUnit" date_id="orderUnit"></td>'+
						'<td class="tdData editTemplateInputLine remark" style="padding: 0" date_id="remark"><input type = "text" class="editTemplateInput encoding-input"></td>'+
						'<td class="tdData goodsID" date_id="goodsID"  style="display:none"></td>'+
						'<td class="arrowMove">'+
						'<span>'+
						'<a name="move" class="glyphicon glyphicon-arrow-up sort-top toparrowDirection" title="移到顶部" href="javascript:void(0);"></a> '+
						'<a name="move" class="glyphicon glyphicon-arrow-down sort-bottom bottomDirection" title="移到底部" href="javascript:void(0);"></a> '+
						'<a name="move" class="glyphicon glyphicon-arrow-up sort-up uparrowDirection" title="上移" href="javascript:void(0);"></a> '+
						'<a name="move" class="glyphicon glyphicon-arrow-down sort-down" title="下移" href="javascript:void(0);"></a> '+
						'</span>'+
						'</td>'+
						'</tr>'
						);
					},
					/*删除当前行*/
					minusline:function (e) {
						var meEl = $(e.currentTarget),
							meTrEl = meEl.closest('tr'),
							meTbody = meTrEl.closest('tbody'),
							lastTrEl = meTbody.find(' > tr').last(),
							lastIndexEl = lastTrEl.find('.index'),
							lastIndexValue = parseInt(lastIndexEl.text());

						if(lastIndexValue == 1){
							$('tbody.dialogTable>tr').each(function(index,itme) {
								$(this).find('td').eq(2).html("");
								$(this).find('td:eq(3) input').val("");
								$(this).find('td.goodsDesc').html("");
								$(this).find('td.orderUnit').html("");
								$(this).find('td.remark input').val("");

							});
							return;
						}
						var currentStep=$(e.currentTarget).closest('tr').find(".index").html();
						$(".modal-body tr").each(function () {
							var seq = parseInt($(this).children("td").html());
							if (seq == currentStep) { $(this).remove(); }
							if (seq > currentStep) { $(this).children("td").each(function (i) { if (i == 0) $(this).html(seq - 1); }); }
						});
					},
					//编辑下新增物资
					shopAdd:function(e){
						var that = this,
							meEl = $(e.currentTarget);
						categorydata = {
							"groupID":groupID,
							"flag":"1"
						};
						Tools.Ajax('/basic/goodsCategory/queryAll', JSON.stringify(categorydata), 'post', function(typeArray){
							var addGoodsDialog = BackboneDialog.extend({
								title: "选择品项",
								body: _.template(addGoodsDialogTpl)({typeArray: typeArray}),
								backdrop: 'static',
								buttons: [{
									className: 'button-cancel white-btn',
									label: '取消',
									close: true,
									href: 'javascript:void(0)'
								},{
									className: 'button-sure green-btn',
									label: '确定',
									href: 'javascript:void(0)'

								}],
								events: {
									"hidden.bs.modal": "onHidden",
									"click .modal-footer a.button-sure": "onSure",
									'click .applicable-organization':'applicableOrganization',
									'click .kc-supply-menu .group-first .content': 'clickPlusOrMinusIcon',
									'click .kc-supply-menu .selectCategoryName': 'selectCheckedAllLeft',
									'click .dialog-addMaterials .move-right': 'moveRight',
									'click  .dialog-table-style .checkedAll-materials': 'selectCheckedAllRight',
									'click  .dialog-table-style .selectgoods': 'selectSameGoods',
									'click .dialog-right-materials .delete-selected': 'deleteSelected'
								},
								onSure: function(e) {
									var addNewOrderTrs =$("#template_table > tbody > tr");
									//去除"品项名称"为空的tr
									_.each(addNewOrderTrs, function(item){
										var goodName = $(item).find(".goodsName-input").val();
										if(!goodName) {
											$(item).remove();
										}
									});
									var thatDialog = this;
									thatDialog.$el.find('table.goodsStepTable tbody tr').each(function(){
										var goodsID  =	$(this).data("goodsid"),
											goodsCode =$(this).data("goodscode"),
											unit =$(this).data("unit"),
											goodsName = $(this).find('td').eq(3).html(),
											goodsDesc = $(this).find('td').eq(4).html(),
											status = $(this).find('td').eq(6).html();

										var max_line_num = $("#template_table > tbody > tr:last-child").children("td").html();
										if (max_line_num == null) {
											max_line_num = 1;
										}
										else {
											max_line_num = parseInt(max_line_num);
											max_line_num += 1;
										}
										var line = "line_"+max_line_num;
										that.$body.find(".dialogTable tbody").append(
											'<tr id='+line+'>'+
											'<td class="tdData index" date_id=sortIndex>'+max_line_num+'</td>'+
											'<td width="77px" class="kc-supply-text-left">' +
											'<span class="addOrDelete-tr">' +
											'<a href="javascript:void(0);" class="plus" style="margin-right: 5px">新增</a> ' +
											'</span>' +
											'<span class="addOrDelete-tr">' +
											'<a href="javascript:void(0);" class="minus">删除</a>' +
											'</span>' +
											'</td>' +
											'<td class="tdData goodCode" date_id="goodCode">'+goodsCode+'</td>'+
											'<td class="tdData kc-supply-text-left editTemplateInputLine" style="padding: 0 " date_id="goodsName">'+
											'<div class="suggest-wrapper">'+
											'<div class="input-group">'+
											'<input type = "text" value='+goodsName+' class="editTemplateInput goodsName-input" >'+
											'<div class="input-group-btn">'+
											'<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>'+
											'</div>'+
											'</div>'+
											'</div>'+
											'</td>'+
											'<td class="tdData goodsDesc" date_id="goodsDesc">'+goodsDesc+'</td>'+
											'<td class="tdData orderUnit" date_id="orderUnit">'+unit+'</td>'+
											'<td class="tdData editTemplateInputLine remark" style="padding: 0" date_id="remark"><input type = "text" class="editTemplateInput"></td>'+
											'<td class="tdData goodsID" date_id="goodsID"  style="display:none">'+goodsID+'</td>'+
											'<td class="arrowMove">'+
											'<span>'+
											'<a name="move" class="glyphicon glyphicon-arrow-up sort-top toparrowDirection" title="移到顶部" href="javascript:void(0);"></a> '+
											'<a name="move" class="glyphicon glyphicon-arrow-down sort-bottom bottomDirection" title="移到底部" href="javascript:void(0);"></a> '+
											'<a name="move" class="glyphicon glyphicon-arrow-up sort-up uparrowDirection" title="上移" href="javascript:void(0);"></a> '+
											'<a name="move" class="glyphicon glyphicon-arrow-down sort-down" title="下移" href="javascript:void(0);"></a> '+
											'</span>'+
											'</td>'+
											'</tr>')
										/*that.$body.find(".dialogTable tbody").append(
											'<tr id='+line+'>'+
											'<td class="tdData index" date_id=sortIndex>'+max_line_num+'</td>'+
											'<td class="tdData kc-supply-text-left">' +
											'<span class="addOrDelete-tr">' +
											'<a href="javascript: void(0);" class="plus">新增</a> ' +
											'</span>' +
											'<span class="addOrDelete-tr">' +
											'<a href="javascript: void(0);" class="minus">删除</a>' +
											'</span>' +
											'</td>'+
											'<td class="tdData" date_id="goodCode">'+goodsCode+'</td>'+
											'<td class="tdData editTemplateInputLine" style="padding: 0" date_id="goodsName"><input type = "text" value='+goodsName+' class="editTemplateInput editTemplateIndexGoodsName" ></td>'+
											'<td class="tdData goodsDesc" date_id="goodsDesc">'+goodsDesc+'</td>'+
											'<td class="tdData orderUnit" date_id="orderUnit">'+unit+'</td>'+
											'<td class="tdData editTemplateInputLine remark"  style="padding: 0" date_id="remark"><input type = "text"  class="editTemplateInput"></td>'+
											'<td class="tdData goodsID" date_id="goodsID"  style="display:none">'+goodsID+'</td>'+
											'<td class="arrowMove">'+
											'<span>'+
											'<a name="move" class="glyphicon glyphicon-arrow-up sort-top toparrowDirection" title="移到顶部" href="javascript:void(0);"></a> '+
											'<a name="move" class="glyphicon glyphicon-arrow-down sort-bottom bottomDirection" title="移到底部" href="javascript:void(0);"></a> '+
											'<a name="move" class="glyphicon glyphicon-arrow-up sort-up uparrowDirection" title="上移" href="javascript:void(0);"></a> '+
											'<a name="move" class="glyphicon glyphicon-arrow-down sort-down" title="下移" href="javascript:void(0);"></a> '+
											'</span>'+
											'</td>'+
											'</tr>');*/
									});
									_.each($("#template_table > tbody > tr"), function(item, index){
										$(item).attr('index', index + 1);
										$(item).find('td').eq(0).text(index + 1);
									});
									thatDialog.$el.modal("hide");
									thatDialog.remove();

									e.stopPropagation();

								},
								//全选框
								clickPlusOrMinusIcon: function(e){
									var me = this,
										meEl = $(e.currentTarget);

									if(meEl.closest('li').find('ul.types').length == 0) {
										return;
									}
									if(meEl.children().children().hasClass('drop-up-icon')){// +
										meEl.children().children().removeClass('drop-up-icon').addClass('drop-down-icon');
									}else {// -
										meEl.children().children().removeClass('drop-down-icon').addClass('drop-up-icon');
									}
									meEl.closest('li').find('ul.types').eq(0).toggle();
									e.stopPropagation();
								},
								//右侧全选
								selectCheckedAllLeft: function(e) {
									var me = this,
										meEl = $(e.currentTarget);
									if(meEl.prop("checked")) {
										meEl.closest("li").find("input.selectCategoryName").prop("checked",true);
										meEl.closest("li").find("input.selectGoodsName").prop("checked",true);
										meEl.closest("li").find("input.selectGoodsName:disabled").prop("checked",false);
									}else {
										meEl.closest("li").find("input.selectCategoryName").prop("checked",false);
										meEl.closest("li").find("input.selectGoodsName").prop("checked",false);
									}
									e.stopPropagation();
								},
								//移动到右侧
								moveRight: function(e) {
									var me = this,
										meEl = $(e.currentTarget);
									me.$body.find('.dialog-left-content input[class="selectGoodsName"]:checked').each(function(index,item){
										var goodsName = $(this).closest("li").data("goodsname"),
											goodsCode = $(this).closest("li").data("goodscode"),
											goodsID = $(this).closest("li").data("goodsid"),
											goodsDesc = $(this).closest("li").data("goodsdesc"),
											isActive = $(this).closest("li").data("isactive"),
											unit = $(this).closest("li").data("unit");
										me.$body.find(".dialog-table-style").append(
											'<tr data-goodsID='+goodsID+' data-goodsCode='+goodsCode+'' +
											' data-unit='+unit +'>'+
											'<td></td>'+
											'<td><input type="checkbox" name="goodsChecks" class="selectgoods" checked></td>'+
											'<td>'+goodsCode+'</td>'+
											'<td class="kc-supply-text-left">'+goodsName+'</td>'+
											'<td>'+goodsDesc+'</td>'+
											'<td>'+unit+'</td>'+
											'<td>'+Tools.getStaticOptions("isActive",isActive)+'</td>'+
											'</tr>');
										console.log(goodsName);
										e.stopPropagation();
									});
									me.$body.find('.dialog-table-style>tbody>tr').each(function(index,item){
										$(this).find('td').eq(0).html(index+1);
									});
									//左侧已经移动的不可勾选
									me.$body.find('input.selectGoodsName:checked').attr({"checked":false}).attr({"disabled":true});
									me.$body.find('input.selectCategoryName:checked').attr({"checked":false});
								},
								//右侧全选
								selectCheckedAllRight: function(e) {
									var me = this,
										meEl = $(e.currentTarget);
									if(meEl.prop("checked")) {
										meEl.closest("table").find("input[type=checkbox]").prop("checked",true);
									}else {
										meEl.closest("table").find("input[type=checkbox]").prop("checked",false);
									}
									e.stopPropagation();
								},
								//右侧选中一种品相
								selectSameGoods:function(e) {
									var me = this,
										meEl = $(e.currentTarget);
									if(meEl.prop("checked")){
										meEl.closest(".dialog-table-style").find("tr").each(function(){
											if($(this).data("goodsid")==meEl.closest("tr").data("goodsid")){
												$(this).find("input[type=checkbox]").prop("checked",true);
											}
										});
									}else{
										meEl.closest(".dialog-table-style").find("tr").each(function(){
											if($(this).data("goodsid")==meEl.closest("tr").data("goodsid")){
												$(this).find("input[type=checkbox]").prop("checked",false);
											}
										});
									}

									e.stopPropagation();
								},
								//删除右侧被选中的品相
								deleteSelected: function(e) {
									var me = this,
										meEl = $(e.currentTarget);
									me.$body.find('.dialog-rightContent input.selectgoods:checked').each(function(){
										var goodsID = $(this).closest("tr").data("goodsid");
										me.$body.find('.dialog-left-content input[type="checkbox"]:disabled').each(function() {
											if($(this).closest("li").data("goodsid") == goodsID){
												$(this).removeAttr("disabled");
											}
										});
									});
									me.$body.find('.dialog-rightContent td input[name="goodsChecks"]:checked').closest('tr').remove();
									me.$body.find('.dialog-rightContent th .checkedAll-materials').prop("checked", false);

									//给表格加序号
									me.$body.find('.dialog-table-style>tbody>tr').each(function(index,item){
										$(this).find('td').eq(0).html(index);
									});

									e.stopPropagation();

								},
								//选择适用组织
								applicableOrganization: function(e) {
									var me = this,
										meEl = $(e.currentTarget);
									var	data = {
										"groupID":that.options.groupID,
										"isActive":"1",
										"distributionID":that.options.demandID
									};
									Tools.Ajax('/basic/organization/getShopAndHouse', JSON.stringify(data), 'post', function(warehouseData){
										var applicableOrganizationDialog = BackboneDialog.extend({
											title: "选择适用门店",
											width:"10px",
											backdrop: 'static',
											body: _.template(applicableOrganizationTpl)({houseArray:  [] || warehouseData[0].list , shopArray: [] || warehouseData[1].list}),
											backdrop: 'static',
											buttons: [{
												className: 'button-cancel white-btn',
												label: '取消',
												close: true,
												href: 'javascript:void(0)'
											},{
												className: 'button-sure green-btn',
												label: '确定',
												href: 'javascript:void(0)'
											}],
											events: {
												"click .modal-body .toggle-warehouse": "warehouseToggle",
												"click .modal-body .warehouse-checkedAll-left": "warehouseCheckedAllLeft",
												"click .modal-body .shop-checkedAll-left": "shopCheckedAllLeft",
												"click .modal-body .warehouse-checkedAll-right": "warehouseCheckedAllRight",
												"click .modal-body .shop-checkedAll-right": "shopCheckedAllRight",
												"click .modal-body .delete-selected": "deleteSelected",
												"click .modal-body .add-organization": "moveRight",
												"click .modal-footer a.button-sure": "onOk",
												"hidden.bs.modal": "onHidden"
											},
											warehouseToggle: function(e){
												var me = this,
													meEl = $(e.currentTarget),
													iconEl = meEl.find('.drop-icon');
												if(iconEl.hasClass('drop-down-icon')) {
													iconEl.removeClass('drop-down-icon').addClass('drop-up-icon');
												}else {
													iconEl.removeClass('drop-up-icon').addClass('drop-down-icon');
												}
												meEl.siblings('.warehouseList-left').toggle();
												e.stopPropagation();
											},
											warehouseCheckedAllLeft: function(e){
												var me = this,
													meEl = $(e.currentTarget),
													warehouseListLeftEl = me.$body.find('.warehouseList-left input[type="checkbox"]'),
													warehouseListLeftElnone = me.$body.find('.warehouseList-left input[type="checkbox"]:disabled');
												if(meEl.prop("checked")) {
													warehouseListLeftEl.prop("checked",true);
													warehouseListLeftElnone.prop("checked",false);
												}else {
													warehouseListLeftEl.prop("checked",false);
												}
												e.stopPropagation();
											},
											shopCheckedAllLeft: function(e) {
												var me = this,
													meEl = $(e.currentTarget),
													shopListLeftEl = me.$body.find('.shopList-left input[type="checkbox"]'),
													shopListLeftElnone = me.$body.find('.shopList-left input[type="checkbox"]:disabled');
												if(meEl.prop("checked")) {
													shopListLeftEl.prop("checked",true);
													shopListLeftElnone.prop("checked",false);
												}else {
													shopListLeftEl.prop("checked",false);
												}
												e.stopPropagation();
											},
											warehouseCheckedAllRight: function(e){
												var me = this,
													meEl = $(e.currentTarget),
													warehouseListLeftEl = me.$body.find('.warehouseList-right input[type="checkbox"]');
												if(meEl.prop("checked")) {
													warehouseListLeftEl.prop("checked",true);
												}else {
													warehouseListLeftEl.prop("checked",false);
												}
												e.stopPropagation();
											},
											shopCheckedAllRight: function(e) {
												var me = this,
													meEl = $(e.currentTarget),
													shopListLeftEl = me.$body.find('.shopList-right input[type="checkbox"]');
												if(meEl.prop("checked")) {
													shopListLeftEl.prop("checked",true);
												}else {
													shopListLeftEl.prop("checked",false);
												}
												e.stopPropagation();
											},
											deleteSelected: function(e) {
												var me = this;
												me.$body.find('.warehouseList-right input[type="checkbox"]:checked').each(function(){
													var demandID = $(this).closest("li").attr("demandID");
													me.$body.find('.warehouseList-left input[type="checkbox"]:disabled').each(function() {
														if($(this).closest("li").attr("demandID") == demandID){
															$(this).removeAttr("disabled");
														}
													});
												});
												me.$body.find('.shopList-right input[type="checkbox"]:checked').each(function(){
													var demandID = $(this).closest("li").attr("demandID");
													me.$body.find('.shopList-left input[type="checkbox"]:disabled').each(function() {
														if($(this).closest("li").attr("demandID") == demandID){
															$(this).removeAttr("disabled");
														}
													});
												});
												me.$body.find('.warehouseList-right input[type="checkbox"]:checked').closest('li').remove();
												me.$body.find('.shopList-right input[type="checkbox"]:checked').closest('li').remove();
												me.$body.find('.warehouse-checkedAll-right').prop("checked", false);
												me.$body.find('.shop-checkedAll-right').prop("checked", false);
												e.stopPropagation();
											},
											moveRight: function(e) {
												var me = this;
												var warehouseList = me.$body.find('.warehouseList-left input[type="checkbox"]:checked').closest('li'),
													warehouseListClone = warehouseList.clone(),
													shopList = me.$body.find('.shopList-left input[type="checkbox"]:checked').closest('li'),
													shopListClone = shopList.clone();
												me.$body.find('.warehouseList-right').append(warehouseListClone);
												me.$body.find('.shopList-right').append(shopListClone);
												//右侧去掉选中状态
												me.$body.find('.warehouseList-right input[type="checkbox"]').prop("checked", false);
												me.$body.find('.shopList-right input[type="checkbox"]').prop("checked", false);
												//左侧已经移动的不可勾选
												me.$body.find('.warehouseList-left input[type="checkbox"]:checked').attr({"checked":false}).attr({"disabled":true});
												me.$body.find('.shopList-left input[type="checkbox"]:checked').attr({"checked":false}).attr({"disabled":true});
												//去除左侧全选的选中状态
												me.$body.find('.warehouse-checkedAll-left').prop("checked", false);
												me.$body.find('.shop-checkedAll-left').prop("checked", false);
											},
											onOk:function (e) {

												that.shopList= [];
												var me = this,
													liList = me.$body.find('.dialog-right-content .dialog-second-ul input[type="checkbox"]').closest('li');
												if(liList.length == 0) {
													Tools.showTips("请先选择门店");
													return;
												}
												_.each(liList, function(item){
													var shopItem = {
														"shopID": $(item).attr('demandid'),
														"shopName": $(item).attr('demandname')
													}
													that.shopList.push(shopItem);
												});
												meEl.data("shopList",that.shopList)
												me.$el.modal("hide");
												me.remove();
												e.stopPropagation();
											}
										});
										var applicableOrganizationDialogInstance = new applicableOrganizationDialog({
											width: '540px'
										}).render();
										//choose绑定数据
										var concatData = warehouseData[0].list.concat(warehouseData[1].list);
										_.each(concatData, function(item) {
											item.orgMnemonicCode = item.orgMnemonicCode.toLowerCase();
										});
										applicableOrganizationDialogInstance.$body.find('#choson-warehouse').chosen({
											data: concatData,
											valField: 'demandID',
											txtField: 'demandName',
											pyField: 'orgMnemonicCode'
										}).on('change', function(){ // change 事件就是 <select> 的 change 事件
											applicableOrganizationDialogInstance.$body.find('.warehouseList-left').show();
											applicableOrganizationDialogInstance.$body.find('.dialog-left-content').find('input[type="checkbox"]').each(function(){
												$(this).prop('checked', false);
											});
											if(!applicableOrganizationDialogInstance.$body.find('.dialog-left-content ul li[demandID="'+this.value+'"]').addClass('active').show().find('input[type="checkbox"]').prop("disabled")){
												applicableOrganizationDialogInstance.$body.find('.dialog-left-content ul li[demandID="'+this.value+'"]').find('input[type="checkbox"]').prop('checked', true);
											};

										});
									});
									e.stopPropagation();
								}
							});
							var addGoodsDialogInstance = new addGoodsDialog({
								width: '856px'
							}).render();
							/*var secondStepDialogInstance = new secondStepDialog({
							 width: '810px'
							 }).render();*/
							//choose绑定数据
							var concatData=[];
							for(var i=0;i<typeArray.length;i++){
								var sub = typeArray[i].childs
								for(var j=0;j<sub.length;j++ ){
									var subItem = sub[j].childs
									for(var k=0;k<subItem.length;k++){
										concatData = concatData.concat(subItem[k].goodsList);
									}
								}
							}
							_.each(concatData, function(item) {
								item.goodsMnemonicCode = item.goodsMnemonicCode.toLowerCase();
							});
							addGoodsDialogInstance.$body.find('#chooson-category').chosen({
								data: concatData,
								valField: 'goodsID',
								txtField: 'goodsName',
								pyField: 'goodsMnemonicCode',
								width: '220px'
							}).on('change', function(){ // change 事件就是 <select> 的 change 事件
								addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').closest('ul.group-second').show();
								addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').closest('ul.group-third').show();
								addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').closest('ul').show();
								addGoodsDialogInstance.$body.find('.dialog-left-content').find('input[type="checkbox"]').each(function(){
									$(this).prop('checked', false);
								});
								if(!addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').addClass('active').show().find('input[type="checkbox"]').prop('disabled')){
									addGoodsDialogInstance.$body.find('.dialog-left-content ul.group-fourth li[goodsID="'+this.value+'"]').find('input[type="checkbox"]').prop('checked', true)
								};
							});
						});

					},
					/*置底*/
					sortbottom:function (e) {
						var meEl = $(e.currentTarget),
							meTrEl = meEl.closest('tr'),
							meTbody = meTrEl.closest('tbody'),
							lastTrEl = meTbody.find(' > tr').last(),
							meIndexEl = meTrEl.find('.index'),
							lastIndexEl = lastTrEl.find('.index'),
							meIndexValue = parseInt(meIndexEl.text()),
							lastIndexValue = parseInt(lastIndexEl.text());

						if(meIndexValue != lastIndexValue) {
							meTrEl.insertAfter(lastTrEl);
						}
						_.each(meTbody.find('>tr'), function(tr, index) {
							$(tr).find('.index').text(index + 1);
						});
					},
					/*置顶*/
					sortTop:function (e) {
						var meEl = $(e.currentTarget),
							meTrEl = meEl.closest('tr'),
							meTbody = meTrEl.closest('tbody'),
							firstTrEl = meTrEl.closest('tbody').find('tr').first(),
							meIndexEl = meTrEl.find('.index'),
							firstIndexEl = firstTrEl.find('.index'),
							meIndexValue = parseInt(meIndexEl.text()),
							firstIndexValue = parseInt(firstIndexEl.text());

						if(meIndexValue != firstIndexValue) {
							meTrEl.insertBefore(firstTrEl);
						}
						_.each(meTbody.find('>tr'), function(tr, index) {
							$(tr).find('.index').text(index + 1);
						});

					},

					/*下移*/
					sortDown:function (e) {
						var meEl = $(e.currentTarget),
							meTrEl = meEl.closest('tr'),
							nextTrEl = meTrEl.next(),
							meIndexEl = meTrEl.find('.index'),
							nextIndexEl = nextTrEl.find('.index'),
							meIndexValue = parseInt(meIndexEl.text()),
							nextIndexValue = parseInt(nextIndexEl.text());

						if(nextTrEl.length) {
							meIndexEl.text(nextIndexValue);
							nextIndexEl.text(meIndexValue);
							meTrEl.insertAfter(nextTrEl);
						}
					},
					/*上移*/
					upline:function(e){
						var meEl = $(e.currentTarget),
							meTrEl = meEl.closest('tr'),
							beforeTrEl = meTrEl.prev(),
							meIndexEl = meTrEl.find('.index'),
							beforeIndexEl = beforeTrEl.find('.index'),
							meIndexValue = parseInt(meIndexEl.text()),
							beforeIndexValue = parseInt(beforeIndexEl.text());

						if(beforeTrEl.length) {
							meIndexEl.text(beforeIndexValue);
							beforeIndexEl.text(meIndexValue);
							meTrEl.insertBefore(beforeTrEl);
						}

					},

					onmodifyOk: function(e) {

						var that = this;
						if(that.$body.find('.changedmodelname').val() == "") {
							Tools.showTips("请添加模板名称");
							return;
						}
						var TemplateData = {
							"templateID":that.$body.find('.changedmodalID').val(),
							"templateName": that.$body.find('.changedmodelname').val(),
							"remark": that.$body.find('.changedmodalRemark').val()
						};
						me.formOptions.chainGoodsTemplate=TemplateData;
						/*将table转成json*/


						/*将table转成json*/
						/*var DemandData={
							"demandID":demandID,
							"demandName":demandName
						};
						me.formOptions.chainGoodsTemplateRelationlist.push(DemandData);*/
						/*如果品相只有一行，并且为空，不能添加*/
						var max_line_num = $("#template_table > tbody > tr:last-child").children("td").html();
						if (max_line_num == 1) {
							var goodsName;
							$('tbody.dialogTable>tr').each(function(index,itme) {
								goodsName = $(this).find('td:eq(3) input').val();//$(this).find('td').eq(3).html();
							});
							if(goodsName == ""){
								Tools.showTips("至少添加一个品项");
								return;
							}
						}
						var dialogtrsSave=$('#template_table tbody.dialogTable>tr');
						_.each(dialogtrsSave, function(item){
							var goodName = $(item).find(".goodsName-input").val();
							if(!goodName) {
								$(item).remove();
							}
						});

						var tableSelector = $('#template_table tbody'), item, attr, data, _JSON = [];
						if (typeof(tableSelector) !== 'object') {
							return new Error('Invalid tableSelector!');
						};
						$('tbody.dialogTable>tr').each(function(index,itme) {
							var itemlist={};
							var sortIndex = $(this).find('td').eq(0).html();
							var goodsCode = $(this).find('td').eq(2).html();
							var goodsName = $(this).find('td:eq(3) input').val();
							//$(this).find('td').eq(3).html();
							var goodsDesc = $(this).find('td.goodsDesc').html();
							var orderUnit = $(this).find('td.orderUnit').html();
							var remark = $(this).find('td.remark input').val()
							var goodsID = $(this).find('td.goodsID').html();
							itemlist['sortIndex']=sortIndex;
							itemlist['goodsCode']=goodsCode;
							itemlist['goodsName']=goodsName;
							itemlist['goodsDesc']=goodsDesc;
							itemlist['orderUnit']=orderUnit;
							itemlist['remark']=remark;
							itemlist['goodsID']=goodsID;
							itemlist['templateID']=that.$body.find('.changedmodalID').val();

								_JSON.push(itemlist);

						});
						console.log(_JSON);
						if(_JSON.length == 0){
							Tools.showTips("至少添加一个品项");
							$('#template_table').append(
								'<tr id="line_1">'+
								'<td class="tdData index" date_id=sortIndex>1</td>'+
								'<td class="tdData kc-supply-text-left">' +
								'<span class="addOrDelete-tr">' +
								'<a href="javascript: void(0);" class="plus">新增</a> ' +
								'</span>' +
								'<span class="addOrDelete-tr">' +
								'<a href="javascript: void(0);" class="minus">删除</a>' +
								'</span>' +
								'</td>'+
								'<td class="tdData goodCode" date_id="goodCode"></td>'+
								'</td>'+
								'<td class="tdData kc-supply-text-left editTemplateInputLine" date_id="goodsName">'+
								'<div class="suggest-wrapper">'+
								'<div class="input-group">'+
								'<input type = "text"  class="editTemplateInput noPadding-inputWidth goodsName-input" >'+
								'<div class="input-group-btn">'+
								'<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>'+
								'</div>'+
								'</div>'+
								'</div>'+
								'</td>'+
								'<td class="tdData goodsDesc" date_id="goodsDesc"></td>'+
								'<td class="tdData orderUnit" date_id="orderUnit"></td>'+
								'<td class="tdData editTemplateInputLine remark" date_id="remark"><input type = "text" class="editTemplateInput noPadding-inputWidth"></td>'+
								'<td class="tdData goodsID" date_id="goodsID"  style="display:none"></td>'+
								'<td class="arrowMove">'+
								'<span>'+
								'<a name="move" class="glyphicon glyphicon-arrow-up sort-top toparrowDirection" title="移到顶部" href="javascript:void(0);"></a> '+
								'<a name="move" class="glyphicon glyphicon-arrow-down sort-bottom bottomDirection" title="移到底部" href="javascript:void(0);"></a> '+
								'<a name="move" class="glyphicon glyphicon-arrow-up sort-up uparrowDirection" title="上移" href="javascript:void(0);"></a> '+
								'<a name="move" class="glyphicon glyphicon-arrow-down sort-down" title="下移" href="javascript:void(0);"></a> '+
								'</span>'+
								'</td>'+
								'</tr>'
							);
							return;
						}
						//me.formOptions.templatedetails.push(_JSON);
						me.formOptions.templatedetails=_JSON;
						Tools.Ajax('/basic/template/modifyTemplate', JSON.stringify(me.formOptions), 'post', function(){
							that.$el.modal("hide");
							that.remove();
							Tools.showTips('编辑订货模板成功!',"success");
							me.render();
						});
						e.stopPropagation();
					},
				});
				new editDialog({
					width: '842px'
				}).render();
				$("#template_table").on('focus','.goodsName-input',function(){
					var suggestInitParas = {
						"element": $(this),
						"url": "/basic/distributionGoods/queryShopGoodsBySearchKey",
						"ajaxData": {
							"groupID": 5,
							//"distributionID": 1000,
							//"demandID": 165708,
							"pageSize":"-1",
							"searchKey": ""
						},
						"effectiveFields": ["goodsCode", "goodsName", "standardUnit", "goodsDesc", "goodsMnemonicCode"],
						"effectiveFieldsAlias": {goodsCode: "编码", goodsName: "名称", standardUnit: "标准单位", goodsDesc: "规格", goodsMnemonicCode: "缩写"},
						"keyField": "goodsName",
						"minWidth": "400px",
						"top": "0px"
					};
					var bsSuggest = Tools.initSuggest(suggestInitParas);
					bsSuggest.on('onSetSelectValue', function (e, keyword, data) {
						var meEl = $(e.currentTarget);
						var $tr = meEl.closest('tr');
						$tr.find('td').eq(2).html(data.goodsCode);
						$tr.find('td.goodsCode').html(data.goodsCode);
						$tr.find('td.goodsDesc').html(data.goodsDesc);
						$tr.find('td.orderUnit').html(data.orderUnit);
						$tr.find('td.goodsID').html(data.goodsID);
					});
				});
			});

		},
		delModal:function(e){
			var me = this,
				meEl = $(e.currentTarget),
				templateID = meEl.data('templateid');
			var delDialog = BackboneDialog.extend({
				title: "删除订货模版",
				width:"10px",
				backdrop: 'static',
				body: '<div class="delete-dialog-body">确定删除此模板？此操作不能撤销。</div>',
				buttons: [{
					className: 'button-cancel white-btn',
					label: '取消',
					close: true,
					href: 'javascript:void(0)'
				},{
					className: 'button-sure green-btn',
					label: '确定',
					href: 'javascript:void(0)'
				}],
				events: {
					"click .modal-footer a.button-sure": "onOk",
					"click .modal-footer a.cancel": "onCancel",
					"hidden.bs.modal": "onHidden",
					"click .modal-body a.more": "moreDetials"
				},
				onOk: function(e) {
					var me = this;
					var	data = {
						"templateID": templateID
					};
					Tools.Ajax('/basic/template/deleteTemplate', JSON.stringify(data), 'post', function(ret){
						meEl.closest('tr').remove();
						Tools.showTips("删除订货模板成功","success");
					});
					me.$el.modal("hide");
					me.remove();
					e.stopPropagation();
				},
			});
			new delDialog({
				width: '490px'
			}).render();
		},
		queryByNameList:function(e){
			var me = this,
				templateName = $.trim(me.$el.find('.special-input').val());

			if(templateName) {
				me.options.templateName = templateName;
				me.ajaxForData();
			}else{
				me.options.templateName = "";
				me.ajaxForData();
			}
			e.stopPropagation();
		},
		searchTemplate:function (e) {
			var me = this,
				meEl = $(e.currentTarget),
				searchKey = $.trim(meEl.val());
			if(e.keyCode == 13) {
				if(searchKey) {
					me.options.templateName = searchKey;
					me.ajaxForData();
				}
			}
			if(searchKey.length!=0){
				me.$el.find(".removeSelected").css("display","block");
			}else{
				me.$el.find(".removeSelected").css("display","none");
				me.removeSelected();
			}
			e.stopPropagation();
		},
		removeSelected:function () {
			var me = this;
			me.$el.find('.special-input').val("");
			me.$el.find(".removeSelected").css("display","none");
			me.options.templateName = "";
			me.ajaxForData();
		},
	});
	return shopOrderTemplateView;
});