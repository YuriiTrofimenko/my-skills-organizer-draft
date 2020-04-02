<template lang='pug'>
  // На действие "Открыть контекстное меню" для всей области рисования
  // устанавливаем собственный обработчик события - contextMenuOpen
  // .container(v-on:contextmenu.prevent='contextMenuOpen' v-longclick='contextMenuOpen')
  .container(v-on:contextmenu.prevent='contextMenuOpen')
    // В верхней части разметки располагаем представления для всплывающих
    // сообщений из библиотеки uimini
    #cancelledMessage.ui-message.ui-message--danger
      span.message-title {{$t('fabric_canvas.messages.cancelled')}}
    #doneMessage.ui-message.ui-message--success
      span.message-title {{$t('fabric_canvas.messages.done')}}
    // html-элемент canvas, на котором библиотека Fabric.js
    // будет осуществлять рисование
    canvas.app-canvas#canvas(ref='canvas') Your browser is too old!
    // Context Menu
    // При вызове контекстного меню отображать его только при условии,
    // что сейчас выбран один узел или одна связь
    vue-context(ref='menu' v-if="checkNode || checkDep")
      ul
        li#showNodeDescriptionContextMenuItem(@click='onContextMenuClick($event.target.id)' v-if="checkNode") {{$t('fabric_canvas.context_menu.node_description')}}
        li#editNodeContextMenuItem(@click='onContextMenuClick($event.target.id)' v-if="checkNode") {{$t('fabric_canvas.context_menu.edit_node')}}
        li#addDependencyContextMenuItem(@click='onContextMenuClick($event.target.id)' v-if="checkNode") {{$t('fabric_canvas.context_menu.add_dependency')}}
        li#deleteNodeContextMenuItem(@click='onContextMenuClick($event.target.id)' v-if="checkNode") {{$t('fabric_canvas.context_menu.delete_node')}}
        li#deleteDepContextMenuItem(@click='onContextMenuClick($event.target.id)' v-if="checkDep") {{$t('fabric_canvas.context_menu.delete_dependency')}}
    // Dialog Box - Delete or not delete selected node or dependency
    .ui-messageBox__wrapper#fabricCanvasModal
      .ui-messageBox.fadeInDown
        .ui-messageBox__header
          span.messageBox-title(v-if="checkNode") {{$t('fabric_canvas.dialogs.delete_node.title')}}
          span.messageBox-title(v-if="checkDep") {{$t('fabric_canvas.dialogs.delete_dependency.title')}}
          span.button-close.ui-messageBox-close
        .ui-messageBox__content
          span(v-if="checkNode") {{$t('fabric_canvas.dialogs.delete_node.content')}}
          span(v-if="checkDep") {{$t('fabric_canvas.dialogs.delete_dependency.content')}}
        .ui-messageBox__footer
          .button.button-light.ui-messageBox-cancel {{$t('fabric_canvas.dialogs.common.cancel')}}
          .button.button-primary.ui-messageBox-ok {{$t('fabric_canvas.dialogs.common.ok')}}
    // Dialog Box - Description of the selected node
    .ui-messageBox__wrapper#fabricCanvasNodeDescriptionModal
      .ui-messageBox.fadeInDown
        .ui-messageBox__header
          span.messageBox-title(v-if="selectedNodeId") {{selectedNode.title}}
          span.button-close.ui-messageBox-close
        .ui-messageBox__content.custom-content-scroll
          span(v-if="selectedNodeId") {{selectedNode.description}}
    // Главная кнопка экрана: начать добавление нового узла
    .fab(@click='addNodeClick') +
    .sidebar-open-button
      .button-burger
        span.line.line-1
        span.line.line-2
        span.line.line-3
    // Боковая панель создания / редактирования узла.
    // По умолчанию скрыта
    .sidebar
      .container
        .sidebar-content
          // /*Форма создания / редактирования узла. */
          // Подавление стандартной отправки пост-запроса формой
          form(v-on:submit.prevent='')
            // Привязка блока с полем ввода к свойству модели
            // с указанием текстов ошибок валидации
            .form-item(:class="{ 'form-group--error': $v.selectedNode.title.$error }")
              label.form__label(for='titleInput') {{$t('fabric_canvas.node_form.title_input.label')}}
              // Поле ввода заголовка узла
              input.form__input#titleInput(type='text' :placeholder="$t('fabric_canvas.node_form.title_input.label')" v-model.trim="$v.selectedNode.title.$model")
            .error(v-if="!$v.selectedNode.title.required") {{$t('fabric_canvas.node_form.title_input.required_error')}}
            .error(v-if="!$v.selectedNode.title.minLength") {{$t('fabric_canvas.node_form.title_input.at_least_error', {number: $v.selectedNode.title.$params.minLength.min})}}
            .error(v-if="!$v.selectedNode.title.maxLength") {{$t('fabric_canvas.node_form.title_input.at_most_error', {number: $v.selectedNode.title.$params.maxLength.max})}}
            .form-item(:class="{ 'form-group--error': $v.selectedNode.type.$error }")
              label.form__label(for='typeSelect') {{$t('fabric_canvas.node_form.type_select.label')}}
              // Выпадающий список выбора типа узла
              select.form__input#typeSelect(v-model.trim="$v.selectedNode.type.$model")
                option(disabled='' value='') {{$t('fabric_canvas.node_form.type_select.select_type')}}
                option(value='1') {{$t('fabric_canvas.node_form.type_select.basis')}}
                option(value='2') {{$t('fabric_canvas.node_form.type_select.desobjectivation')}}
                option(value='3') {{$t('fabric_canvas.node_form.type_select.objectification')}}
            .error(v-if="!$v.selectedNode.type.required") {{$t('fabric_canvas.node_form.type_select.required_error')}}
            .form-item(:class="{ 'form-group--error': $v.selectedNode.description.$error }")
              label.form__label(for='descriptionTextarea') {{$t('fabric_canvas.node_form.description_textarea.label')}}
              // Область ввода текста краткого описания узла
              textarea.form__input#descriptionTextarea(:placeholder="$t('fabric_canvas.node_form.description_textarea.label')" v-model.trim="$v.selectedNode.description.$model")
            .error(v-if="!$v.selectedNode.description.required") {{$t('fabric_canvas.node_form.description_textarea.required_error')}}
            .error(v-if="!$v.selectedNode.description.minLength") {{$t('fabric_canvas.node_form.description_textarea.at_least_error', {number: $v.selectedNode.description.$params.minLength.min})}}
            .error(v-if="!$v.selectedNode.description.maxLength") {{$t('fabric_canvas.node_form.title_input.at_most_error', {number: $v.selectedNode.description.$params.maxLength.max})}}
            // Выпадающий список выбора состояния узла
            .form-item
              label.form__label(for='statusSelect') {{$t('fabric_canvas.node_form.status_select.label')}}
              select.form__input#statusSelect(v-model='selectedNode.status')
                option(value='1') {{$t('fabric_canvas.node_form.status_select.new')}}
                option(value='2') {{$t('fabric_canvas.node_form.status_select.scheduled')}}
                option(value='3' v-if="isNodeDepsSatisfied") {{$t('fabric_canvas.node_form.status_select.started')}}
                option(value='4' v-if="isNodeDepsSatisfied") {{$t('fabric_canvas.node_form.status_select.suspended')}}
                option(value='5') {{$t('fabric_canvas.node_form.status_select.cancelled')}}
                option(value='6' v-if="isNodeDepsSatisfied") {{$t('fabric_canvas.node_form.status_select.done')}}
            .row
              .col-xs-6(style='margin-bottom: 16px;')
                ul
                  li
                    .ui-checkbox-wrapper
                      // Флаг открытия доступа к данным узла для систем сбора информации
                      // о потенциальных клиентах
                      input#accessCheckbox.ui-checkbox(type='checkbox' v-model='selectedNode.access')
                      label.label--inline(for='accessCheckbox' v-tooltip="$t('fabric_canvas.node_form.public.tooltip')") {{$t('fabric_canvas.node_form.public.label')}}
            .row.grid-middle
              .col-xs-6
                // Кнопка отмены добавления / изменения узла
                button.button--round.button--big.button.button-default(type='reset' @click='resetForm') {{$t('fabric_canvas.node_form.buttons.discard')}}
              .col-xs-6
                // Кнопка подтвреждения добавления / изменения узла
                button.button--round.button--big.button.button-success(type='submit' :disabled='$v.selectedNode.$invalid' @click.prevent='applyNodeDataClick') {{$t('fabric_canvas.node_form.buttons.apply')}}
    v-tour(name='canvas' :steps='steps' :callbacks="canvasTourCallbacks")
      template(slot-scope='tour')
        transition(name='fade')
          v-step(v-if='tour.currentStep === index' v-for='(step, index) of tour.steps' :key='index' :step='step' :previous-step='tour.previousStep' :next-step='tour.nextStep' :stop='tour.stop' :is-first='tour.isFirst' :is-last='tour.isLast' :labels='tour.labels')
</template>

<script>
import { fabric } from 'fabric'
import { VueContext } from 'vue-context'
import { uiMessage, showMessage, showSidebar, hideSidebar } from '@/assets/js/uimini.js'
import { required, minLength, maxLength } from 'vuelidate/lib/validators'
import '../assets/css/main.css'

export default {
  name: 'FabricCanvas',

  props: ['elemsGetter', 'depsGetter', 'actionNames', 'bus'],

  components: {
    VueContext
  },

  data () {
    // Модель для представления
    return {
      canvas: null,
      submitStatus: '',
      isObjectMoving: false,
      selectedNodeId: null,
      selectedDepId: null,
      nodeDeleteDialogHandler: null,
      depDeleteDialogHandler: null,
      showNodeDescriptionDialogHandler: null,
      selectedNode: {
        title: '',
        description: '',
        type: '',
        status: '1',
        access: false
      },
      formMode: '',
      dependenceCreationHint: null,
      dependentNodeId: null,
      selectedNodeDepsSatisfied: false, // Удовлетворены ли все зависиомсти выделенного узла
      canvasTourCallbacks: {
        onPreviousStep: this.PreviousStepCallback,
        onNextStep: this.NextStepCallback,
        onStop: this.StopCallback
      },
      lastMouseEvent: null
    }
  },
  // Правила валидации
  validations: {
    selectedNode: {
      title: {
        required,
        minLength: minLength(8),
        maxLength: maxLength(128)
      },
      type: {
        required
      },
      description: {
        required,
        minLength: minLength(8),
        maxLength: maxLength(500)
      }
    }
  },
  computed: {
    elems () {
      // источник данных об узлах
      return this.$store.getters[this.elemsGetter]
    },
    deps () {
      // источник данных о связях
      return this.$store.getters[this.depsGetter]
    },
    width () {
      // Вычисление ширины области рисования
      return this.$parent.$el.clientWidth
    },
    height () {
      // Вычисление высоты области рисования
      return this.$parent.$el.clientHeight
    },
    widthCenter () {
      // Вычисление центра области рисования по ширине
      return this.width / 2
    },
    heightCenter () {
      // Вычисление центра области рисования по высоте
      return this.height / 2
    },
    checkNode () {
      // Проверка: есть ли выделенный узел
      return this.selectedNodeId !== null
    },
    checkDep () {
      // Проверка: есть ли выделенная связь
      return this.selectedDepId !== null
    },
    isNodeDepsSatisfied () {
      // Проверка: удовлетворены ли все зависимости выделенного узла
      return this.selectedNodeDepsSatisfied
    },
    // v-tour
    steps () {
      return [
        {
          target: '.fab', // We're using document.querySelector() under the hood
          content: this.$t('fabric_canvas.vtour.start_planning')
        },
        {
          target: '.form-item > #titleInput',
          content: this.$t('fabric_canvas.vtour.enter_name')
        },
        {
          target: '.ui-checkbox-wrapper',
          content: this.$t('fabric_canvas.vtour.improve_ads_service')
        }
      ]
    }
  },
  watch: {
    // Если изменился список узлов или связей - обновляем область рисования
    elems (newVal, oldVal) {
      // console.log('elems')
      this.canvas.setHeight(this.recomputeCanvasHeight())
      this.canvas.renderAll()
      this.fabricDraw(this.elems, this.deps)
    },
    deps (newVal, oldVal) {
      this.fabricDraw(this.elems, this.deps)
    }
  },
  mounted () {
    let canvasHeight = this.recomputeCanvasHeight()
    // Создание объекта рисования по ссылке на элемент canvas в разметке
    this.canvas = new fabric.Canvas(this.$refs.canvas, {
      width: this.width,
      height: canvasHeight,
      selectionColor: '#90ccb7',
      backgroundColor: '#fff',
      selection: false
    })
    // Регистрация обработчиков различных событий в области рисования
    this.canvas.on('object:moving', this.nodeMoving)
    this.canvas.on('mouse:up', this.nodeMouseUp)
    this.canvas.on('object:modified', this.nodeModified)
    this.canvas.on('selection:created', this.selectionCreated)
    this.canvas.on('selection:cleared', this.selectionCleared)
    this.canvas.on('selection:updated', this.selectionUpdated)
    this.canvas.on('mouse:move', this.mouseMove)
    this.canvas.on('mouse:down', this.mouseDown)
    // Первая, безусловная отрисовка элементов и связей в области рисования
    this.fabricDraw(this.elems, this.deps)
    if (!this.$cookies.get('vtour_fabric_canvas_finished')) {
      this.$tours['canvas'].start()
    }
  },
  methods: {
    // Метод отрисовки элементов и связей в области рисования
    /* fabricReDraw () {
      this.fabricDraw(this.elems, this.deps)
      console.log(this.elems, this.deps)
      this.canvas.renderAll()
    },
    fabricClearCanvas () {
      this.canvas.remove(...this.canvas.getObjects())
    }, */
    fabricDraw (elems, deps) {
      // Удалить весь список фабрик-объектов в области рисования
      this.canvas.remove(...this.canvas.getObjects())
      elems.forEach(n => {
        var color = 'white'
        // В зависимости от состояния узла выбираем цвет
        if (n.status === '1') {
          // New - СветлоСерый
          color = '#ccc'
        } else if (n.status === '2' && n.dependenciesSatisfied) {
          // Scheduled (some deps are not satisfied) - Красный
          color = '#0066FF'
        } else if (n.status === '2' && !n.dependenciesSatisfied) {
          // Scheduled - Синий
          color = '#FF0000'
        } else if (n.status === '3') {
          // Started - Желтый
          color = '#FFFF00'
        } else if (n.status === '4') {
          // Suspended - ТемноСерый
          color = '#999999'
        } else if (n.status === '5') {
          // Cancelled - Черный
          color = '#333333'
        } else if (n.status === '6') {
          // Done - Зеленый
          color = '#26de81'
        }
        // Создаем объект "окружность" на основе данных текущего узла
        var nodeCircle = new fabric.Circle({id: n.id, fill: color, radius: n.radius, top: n.top, left: n.left})
        // ... добавляем его в область рисования
        this.canvas.add(nodeCircle)
        // ... отключаем у него элементы управления
        nodeCircle.hasControls = false
        // ... отправляем его на самый дальний план
        this.canvas.sendToBack(nodeCircle)
        // Создаем объект "текст" на основе заголовка текущего узла
        var nodeTitleText = new fabric.Text(n.title, {id: n.id + '_title', top: n.top - 20, left: n.left, fontSize: 20})
        // ... добавляем его в область рисования в конец списка объектов
        this.canvas.insertAt(nodeTitleText, this.canvas.getObjects().length)
        // ... отключаем у него элементы управления, рамки и возможность выделения
        nodeTitleText.hasControls = nodeTitleText.hasBorders = nodeTitleText.selectable = false
      }
      )
      // После рисования всех узлов и их заголовков вызываем рисование всех линий, отображающих стрелки связей
      this.drawLines(elems, deps)
    },
    // Метод обработки клика по плавающей кнопке действия
    addNodeClick () {
      // Вызов очистки формы редактирования данных узла
      this.resetForm()
      // Переключение флага режима формы редактирования данных узла в состояние создания нового узла
      this.formMode = 'create'
      // Установка обработчика завершения перехода левой панели в открытое состояние
      document.querySelector('.sidebar').addEventListener('transitionend', this.onShowSidebarEnd, false)
      // Вызов отображения боковой панели с формой редактирования данных узла
      showSidebar()
    },
    // Обработчик завершения перехода левой панели в открытое состояние
    onShowSidebarEnd () {
      // console.log('onShowSidebarEnd')
      this.$tours['canvas'].nextStep()
      // Удаление обработчика завершения перехода левой панели в открытое состояние
      document.querySelector('.sidebar').removeEventListener('transitionend', this.onShowSidebarEnd, false)
    },
    // Метод обработки перетаскивания узла по области рисования
    nodeMoving (ev) {
      this.isObjectMoving = true
      if (this.selectedNodeId !== null) {
        const modifiedObject = ev.target
        const newLeft = modifiedObject.get('left')
        const newTop = modifiedObject.get('top')
        // Вслед за отображением узла перемещаем его заголовок
        const movingNodeText =
          this.canvas.getObjects().filter(
            o => (o.get('type') === 'text') && (o.get('id') === this.selectedNodeId + '_title')
          )[0]
        movingNodeText.set({
          'left': newLeft,
          'top': newTop - 20
        })
      }
    },
    // Метод обработки отпускания узла указателем мыши после перетаскивания
    nodeMouseUp (ev) {
      if (this.isObjectMoving) {
        var modifiedObject = ev.target
        this.isObjectMoving = false
        const id = modifiedObject.get('id')
        const newLeft = modifiedObject.get('left')
        const newTop = modifiedObject.get('top')
        // сохраняем новые координаты узла после окончания его перетаскивания
        this.$store.dispatch(this.actionNames.editNode, {
          id: id,
          changes: {
            left: newLeft,
            top: newTop
          }
        })
          .then(() => {
            this.canvas.setHeight(this.recomputeCanvasHeight())
            // this.canvas.renderAll()
            this.submitStatus = 'OK'
          })
          .catch(err => {
            this.submitStatus = err.message
          })
      }
    },
    // Метод обработки выделения узла указателем мыши (ЛКМ)
    selectionCreated (ev) {
      var selectedObject = this.canvas.getActiveObject()
      // Обрабатываются только выделения узлов и линий
      if (typeof (this.canvas.getActiveObject()) !== 'undefined') {
        this.selectedNodeId = null
        this.selectedDepId = null
        if (this.canvas.getActiveObject().get('type') === 'circle') {
          this.selectedNodeId = selectedObject.get('id')
        } else if (this.canvas.getActiveObject().get('type') === 'line') {
          this.selectedDepId = selectedObject.get('id')
        }
      }
    },
    // Метод обработки снятия выделения с узла или связи
    selectionCleared (ev) {
      this.selectedNodeId = null
      this.selectedDepId = null
      hideSidebar()
    },
    // Метод обработки изменения выделения узла или связи
    selectionUpdated (ev) {
      var updatedObject = this.canvas.getActiveObject()
      if (typeof (updatedObject) !== 'undefined') {
        this.selectedNodeId = null
        this.selectedDepId = null
        if (this.canvas.getActiveObject().get('type') === 'circle') {
          this.selectedNodeId = updatedObject.get('id')
        } else if (this.canvas.getActiveObject().get('type') === 'line') {
          this.selectedDepId = updatedObject.get('id')
        }
      }
    },
    // Handle mousemove when dependence creation hint is shown
    // Метод обработки перемещения курсора мыши, когда показана подсказка создания зависимости
    mouseMove (ev) {
      this.lastMouseEvent = ev
      if (this.isObjectMoving) {
        var modifiedObject = ev.target
        const id = modifiedObject.get('id')
        const newLeft = modifiedObject.get('left')
        const newTop = modifiedObject.get('top')
        // Вызов перерисовки стрелки зависимости
        this.moveLine(id, newLeft, newTop, this.deps)
      }
    },
    // Handle mousedown when dependence creation is finishing
    // Метод обработки клика курсора мыши, которым завершается создание зависимости
    // (должен указывать на узел, зависимость от которого образуется)
    mouseDown (ev) {
      if (this.dependenceCreationHint !== null) {
        if (ev.target && this.checkNode) {
          const fromNodeId = this.dependentNodeId
          const toNodeId = this.selectedNodeId
          // const selectedNodeStatus = this.selectedNode.status
          // Отправка в хранилище команды "Создать новую зависимость"
          this.$store.dispatch(this.actionNames.newDep, {
            fromNodeId: fromNodeId,
            toNodeId: toNodeId
          })
            .then(() => {
              // Если удалось - устанавливается флаг успешно завершенной операции
              this.submitStatus = 'OK'
              // Получем из хранилища модель зависимого узла, ОТ которого должна идти стрелка
              const fromNode = this.elems.filter(n => n.id === fromNodeId)[0]
              // Получем из хранилища модель зависимого узла, К которому должна идти стрелка
              const toNode = this.elems.filter(n => n.id === toNodeId)[0]
              // Если ранее все зависимости узла были удовлетворены,
              // но статус выделенного узла (от которого будет зависимость) - не "Сделано"
              if (fromNode.dependenciesSatisfied && toNode.status !== '6') {
                // Изменяем в хранилище состояние модели на "не все зависимости удовлетворены"
                this.$store.dispatch(this.actionNames.editNode, {
                  id: fromNodeId,
                  changes: {
                    dependenciesSatisfied: false
                  }
                })
                  .then(() => {
                    this.submitStatus = 'OK'
                    // Перерисовываем всю область рисования
                    this.fabricDraw(this.elems, this.deps)
                  })
                  .catch(err => {
                    this.submitStatus = err.message
                  })
              }
            })
            .catch(err => {
              this.submitStatus = err.message
            })
        } else {
          console.log('dependency creation is cancelled')
        }
        // После образования зависимости удаляем текст соответствующей подсказки
        this.canvas.remove(this.dependenceCreationHint)
        this.dependenceCreationHint = null
        this.dependentNodeId = null
      }
    },
    contextMenuOpen (ev) {
      // ev.stopPropagation()
      // ev.stopImmediatePropagation()
      if (this.$refs.menu) {
        if (!ev) {
          ev = this.lastMouseEvent.e
          console.log('contextMenuOpen', ev)
        }
        console.log('contextMenuOpen', ev)
        this.$refs.menu.open(ev)
      }
      // return false
    },
    onContextMenuClick (id) {
      if (id === 'deleteNodeContextMenuItem') {
        this.nodeDeleteDialogHandler = uiMessage(this.nodeDeleteDialogItOk, this.nodeDeleteDialogItCancel, 'fabricCanvasModal')
        this.nodeDeleteDialogHandler.call()
      } else if (id === 'addDependencyContextMenuItem') {
        // Выбран пункт контекстного меню области рисования "Добавить зависимость"
        var hintText =
          new fabric.Text(
            this.$t('fabric_canvas.dep_creation.select_parent_node')
            , {
              top: this.canvas.getActiveObject().top + 100,
              left: this.canvas.getActiveObject().left,
              fontSize: 20,
              fill: '#06f'
            })
        this.canvas.insertAt(hintText, this.canvas.getObjects().length)
        hintText.hasControls = hintText.hasBorders = hintText.selectable = false
        this.dependenceCreationHint = hintText
        this.dependentNodeId = this.selectedNodeId
      } else if (id === 'editNodeContextMenuItem') {
        this.setForm()
        showSidebar()
        this.formMode = 'edit'
      } else if (id === 'deleteDepContextMenuItem') {
        this.depDeleteDialogHandler = uiMessage(this.depDeleteDialogItOk, this.depDeleteDialogItCancel, 'fabricCanvasModal')
        this.depDeleteDialogHandler.call()
      } else if (id === 'showNodeDescriptionContextMenuItem') {
        this.selectedNode = this.elems.find(elem => elem.id === this.selectedNodeId)
        this.showNodeDescriptionDialogHandler = uiMessage(null, null, 'fabricCanvasNodeDescriptionModal')
        this.showNodeDescriptionDialogHandler.call()
      }
    },
    nodeDeleteDialogItOk () {
      // Вызываем в хранилище действие удаления выделенного узла
      this.$store.dispatch(this.actionNames.deleteNode, this.selectedNodeId)
        .then(() => {
          this.nodeDeleteDialogHandler = null
          showMessage('#doneMessage')
        })
    },
    nodeDeleteDialogItCancel () {
      this.nodeDeleteDialogHandler = null
      showMessage('#cancelledMessage')
    },
    // Обработчик клика ОК в диалоге подстверждения удаления зависимости
    depDeleteDialogItOk () {
      // Поиск дата-модели зависимого узла (из которого исходит стрелка)ы
      const fromNodeId = this.deps.filter(d => d.id === this.selectedDepId)[0].fromNodeId
      const sourceNode = this.elems.filter(n => n.id === fromNodeId)[0]
      // TODO Вызываем в хранилище действие удаления выделенной зависимости
      this.$store.dispatch(this.actionNames.deleteDep, this.selectedDepId)
        .then(() => {
          this.depDeleteDialogHandler = null
          // Затем вызываем функцию пересчета удовлетворенности зависимостей для зависимого узла
          this.recomputeNodeDeps(sourceNode)
          // Вызываем отображение всплывающего сообщения "Сделано"
          showMessage('#doneMessage')
        })
    },
    depDeleteDialogItCancel () {
      this.depDeleteDialogHandler = null
      // Вызываем отображение всплывающего сообщения "Отменено"
      showMessage('#cancelledMessage')
    },
    // Метод установки выбранного узла и флага удовлетворенности его зависимостей
    // для дальнейшего редактирования в форме
    setForm () {
      if (this.checkNode) {
        this.selectedNode = this.elems.find(elem => elem.id === this.selectedNodeId)
        this.selectedNodeDepsSatisfied = this.selectedNode.dependenciesSatisfied
      }
    },
    // Обработчик клика по кнопке "Сделано" в форме создания/редактирования узла
    applyNodeDataClick () {
      if (this.formMode === 'create') {
        // Находим координату высоты у самого нижнего из имеющихся узлов,
        // если есть хотя бы один узел,
        // иначе - оставляем значение середины области рисования по высоте
        let maxNodeTop = 100
        if (this.elems[0]) {
          maxNodeTop = this.elems[0].top
          this.elems.forEach(n => {
            if (n.top > maxNodeTop) {
              maxNodeTop = n.top
            }
          })
          maxNodeTop += 200
        }
        // Добавляем новый узел в хранилище
        this.$store.dispatch(this.actionNames.newNode, {
          title: this.selectedNode.title,
          type: this.selectedNode.type,
          description: this.selectedNode.description,
          access: this.selectedNode.access,
          status: this.selectedNode.status,
          dependenciesSatisfied: true,
          radius: 50,
          left: this.widthCenter - 100,
          top: maxNodeTop
        })
          .then(() => {
            window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight)
            this.submitStatus = 'OK'
          })
          .catch(err => {
            this.submitStatus = err.message
          })
      } else if (this.formMode === 'edit') {
        // Обработка отправки формы в режиме редактирования
        // TODO оптимизировать количество вызовов этой логики:
        // только когда изменился статус узла
        // filter all deps with nodeTo == this.selectedNodeId
        // Отбор моделей зависимостей, входящих в данный узел
        const depsTo = this.deps.filter(d => d.toNodeId === this.selectedNodeId)
        // for each dep filter source Node
        // По каждой из зависимостей найти узел, из которого она исходит
        depsTo.forEach(dTo => {
          const sourceNodes = this.elems.filter(n => n.id === dTo.fromNodeId)
          // fore each source Node
          // Для каждого узла, из которого зависимость входит в отредактированный узел
          sourceNodes.forEach(n => {
            // Вызать пересчет удовлетворенности зависимостей
            this.recomputeNodeDeps(n)
          }
          )
        }
        )
        // do edit selected Node
        // TODO Отправлять для обновления только изменившиеся значения
        this.$store.dispatch(this.actionNames.editNode, {
          id: this.selectedNodeId,
          changes: {
            title: this.selectedNode.title,
            type: this.selectedNode.type,
            description: this.selectedNode.description,
            status: this.selectedNode.status,
            access: this.selectedNode.access
          }
        })
          .then(() => {
            this.submitStatus = 'OK'
            this.fabricDraw(this.elems, this.deps)
          })
          .catch(err => {
            this.submitStatus = err.message
          })
      }
      hideSidebar()
      this.formMode = ''
    },
    // Метод сброса состояния формы создания/редактирования узла
    resetForm () {
      this.selectedNode = {
        title: '',
        description: '',
        type: '',
        status: '1',
        access: false
      }
      hideSidebar()
      this.formMode = ''
    },
    // Метод настраиваемого рисования линии
    makeLine (id, coords) {
      return new fabric.Line(coords, {
        id: id,
        fill: '#999999',
        stroke: '#999999',
        strokeWidth: 5,
        selectable: true,
        evented: true,
        hasControls: false,
        lockMovementX: true,
        lockMovementY: true
      })
    },
    // Метод рисования стрелки на основе рисования двух коротких линий
    makeArrow (lineId, x1, y1, x2, y2) {
      // координаты центра отрезка
      const x3 = (x1 + x2) / 2
      const y3 = (y1 + y2) / 2
      // длина отрезка
      const d = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      // координаты вектора
      const x = x2 - x1
      const y = y2 - y1
      // координаты точки, удалённой от центра к началу отрезка на 10px
      const x4 = x3 - (x / d) * 10
      const y4 = y3 - (y / d) * 10
      const xp = y2 - y1
      const yp = x1 - x2
      // координаты перпендикуляров, удалённых от точки X4;Y4 на 5px в разные стороны
      const x5 = x4 + (xp / d) * 5
      const y5 = y4 + (yp / d) * 5
      const x6 = x4 - (xp / d) * 5
      const y6 = y4 - (yp / d) * 5
      return {
        'arrow1': new fabric.Line([x5, y5, x3, y3], {
          id: lineId + '_a1',
          fill: '#999999',
          stroke: '#999999',
          strokeWidth: 5,
          selectable: false,
          evented: false
        }),
        'arrow2': new fabric.Line([x6, y6, x3, y3], {
          id: lineId + '_a2',
          fill: '#999999',
          stroke: '#999999',
          strokeWidth: 5,
          selectable: false,
          evented: false
        })
      }
    },
    // Метод рисования всех зависимостей
    // на основе методов рисования отдельных линий и стрелок
    drawLines (elems, deps) {
      // Удаляем все объекты Линия в области рисования
      this.canvas.remove(...this.canvas.getObjects().filter(o => o.get('type') === 'line'))
      var lostLinesIds = []
      var lostLinesSourceNodes = []
      deps.forEach(d => {
        const nodeFrom = elems.filter(n => n.id === d.fromNodeId)
        const nodeTo = elems.filter(n => n.id === d.toNodeId)
        // Если для зависимости нашелись оба узла - рисуем ее изображение
        if (nodeFrom[0] && nodeTo[0]) {
          var line = this.makeLine(d.id, [ nodeFrom[0].left + 50, nodeFrom[0].top + 50, nodeTo[0].left + 50, nodeTo[0].top + 50 ])
          var arrow = this.makeArrow(d.id, nodeFrom[0].left + 50, nodeFrom[0].top + 50, nodeTo[0].left + 50, nodeTo[0].top + 50)
          this.canvas.add(line, arrow.arrow1, arrow.arrow2)
          this.canvas.sendToBack(line)
          this.canvas.sendToBack(arrow.arrow1)
          this.canvas.sendToBack(arrow.arrow2)
          this.canvas.renderAll()
        } else {
          // ... иначе - добавляем ИД в список "потерянных" зависимостей,
          // если его там еще нет
          if (!lostLinesIds.includes(d.id)) {
            lostLinesIds.push(d.id)
          }
          // и собираем в отдельный список узлы-источники "потерянных" зависимостей
          const sourceNode = this.elems.filter(n => n.id === d.fromNodeId)[0]
          if (!lostLinesSourceNodes.includes(sourceNode)) {
            lostLinesSourceNodes.push(sourceNode)
          }
        }
      }
      )
      // Удаляем из хранилища все "потерянные" зависимости
      lostLinesIds.forEach(lostLineId => {
        // TODO
        this.$store.dispatch(this.actionNames.deleteDep, lostLineId)
          .then(() => {
            console.log('Lost dependency ' + lostLineId + ' removed')
          })
      })
      lostLinesSourceNodes.forEach(lostLineSourceNode => {
        this.recomputeNodeDeps(lostLineSourceNode)
      })
    },
    // Метод перерисовки изображения зависимости
    // при перетаскивании узлов, которые она связывает
    moveLine (nodeId, newLeft, newTop, deps) {
      const depsFromIds = deps.filter(d => d.fromNodeId === nodeId).map(d => d.id)
      const depsToIds = deps.filter(d => d.toNodeId === nodeId).map(d => d.id)
      const lines = this.canvas.getObjects().filter(o => o.get('type') === 'line')
      lines.filter(l => depsFromIds.includes(l.get('id'))).forEach(l => {
        const newLineX1 = newLeft + 50
        const newLineY1 = newTop + 50
        const newLineX2 = l.get('x2')
        const newLineY2 = l.get('y2')
        l.set({ 'x1': newLineX1, 'y1': newLineY1 })
        const lineId = l.get('id')
        const lineArrow1 = lines.filter(la1 => la1.get('id') === lineId + '_a1')[0]
        const lineArrow2 = lines.filter(la2 => la2.get('id') === lineId + '_a2')[0]
        const newLineArrow = this.makeArrow(lineId, newLineX1, newLineY1, newLineX2, newLineY2)
        lineArrow1.set({
          'x1': newLineArrow.arrow1.get('x1'),
          'y1': newLineArrow.arrow1.get('y1'),
          'x2': newLineArrow.arrow1.get('x2'),
          'y2': newLineArrow.arrow1.get('y2')
        })
        lineArrow2.set({
          'x1': newLineArrow.arrow2.get('x1'),
          'y1': newLineArrow.arrow2.get('y1'),
          'x2': newLineArrow.arrow2.get('x2'),
          'y2': newLineArrow.arrow2.get('y2')
        })
        this.canvas.sendToBack(lineArrow1)
        this.canvas.sendToBack(lineArrow2)
      }
      )
      lines.filter(l => depsToIds.includes(l.get('id'))).forEach(l => {
        const newLineX1 = l.get('x1')
        const newLineY1 = l.get('y1')
        const newLineX2 = newLeft + 50
        const newLineY2 = newTop + 50
        l.set({ 'x2': newLineX2, 'y2': newLineY2 })
        const lineId = l.get('id')
        const lineArrow1 = lines.filter(la1 => la1.get('id') === lineId + '_a1')[0]
        const lineArrow2 = lines.filter(la2 => la2.get('id') === lineId + '_a2')[0]
        const newLineArrow = this.makeArrow(lineId, newLineX1, newLineY1, newLineX2, newLineY2)
        lineArrow1.set({
          'x1': newLineArrow.arrow1.get('x1'),
          'y1': newLineArrow.arrow1.get('y1'),
          'x2': newLineArrow.arrow1.get('x2'),
          'y2': newLineArrow.arrow1.get('y2')
        })
        lineArrow2.set({
          'x1': newLineArrow.arrow2.get('x1'),
          'y1': newLineArrow.arrow2.get('y1'),
          'x2': newLineArrow.arrow2.get('x2'),
          'y2': newLineArrow.arrow2.get('y2')
        })
        this.canvas.sendToBack(lineArrow1)
        this.canvas.sendToBack(lineArrow2)
      }
      )
      // Вызов стандартной функции объкта области рисования "Отрисовать все"
      this.canvas.renderAll()
    },
    // Метод пересчета удовлетворенности всех зависимостей для узла node
    recomputeNodeDeps (node) {
      if (node) {
        // Оптимистичное предположение, что все зависимости удовлетворены
        var allDepsSutisfied = true
        // 2 filter all deps with nodeFrom == currentNode.selectedNodeId
        // Отбор всех зависимостей, исходящих из данного узла
        const nodeOutgoingDeps = this.deps.filter(dFrom => dFrom.fromNodeId === node.id)
        // 3 fore each dep find a target Node by nodeTo
        // some возвращает true, если вызов callback вернёт true хотя бы для одного элемента nodeOutgoingDeps,
        // причем, как только callback возвращает true первый раз, выполнение some прекращается,
        // таким образом, после выявления хотя бы одной неудовлетворенной зависимости
        // обработка массива прекращается для экономии ресурсов
        nodeOutgoingDeps.some(dOut => {
          // Находим узел, от которого существует данная зависимость
          // (в который входит изображение зависимости)
          const currentDepNode = this.elems.filter(n => n.id === dOut.toNodeId)[0]
          // 4 check if Node's property status == completed
          if (currentDepNode) {
            // Если статус узла не "Выполнено" -
            // сбрасываем флаг "Все зависимости удовлетворены" и прекращаем работу some
            if (currentDepNode.status !== '6') {
              allDepsSutisfied = false
              return true
            }
          }
        }
        )
        // Если ранее у узла не были удовлетворены все зависимости,
        // и теперь стали - меняем соответствующее значение в его состоянии на "Все удовлетворены"
        if (!node.dependenciesSatisfied && allDepsSutisfied) {
          // 5 if all the Nodes are completed then set edited Node's property dependenciesSatisfied to true
          // TODO
          this.$store.dispatch(this.actionNames.editNode, {
            id: node.id,
            changes: {
              dependenciesSatisfied: true
            }
          })
            .then(() => {
              this.fabricDraw(this.elems, this.deps)
              this.submitStatus = 'OK'
            })
            .catch(err => {
              this.submitStatus = err.message
            })
        } else if (node.dependenciesSatisfied && !allDepsSutisfied) {
          // Если ранее у узла были удовлетворены все зависимости,
          // и теперь - нет - меняем соответствующее значение в его состоянии на "Не все удовлетворены"
          // TODO 5 if all the Nodes are completed then set edited Node's property dependenciesSatisfied to true
          this.$store.dispatch(this.actionNames.editNode, {
            id: node.id,
            changes: {
              dependenciesSatisfied: false
            }
          })
            .then(() => {
              this.fabricDraw(this.elems, this.deps)
              this.submitStatus = 'OK'
            })
            .catch(err => {
              this.submitStatus = err.message
            })
        }
      }
    },
    recomputeCanvasHeight () {
      let canvasHeight = this.height
      if (this.elems[0]) {
        let maxNodeTop = this.elems[0].top
        this.elems.forEach(n => {
          if (n.top > maxNodeTop) {
            maxNodeTop = n.top
          }
        })
        if (maxNodeTop + 100 > canvasHeight) {
          canvasHeight = maxNodeTop + 100
        }
      }
      return canvasHeight
    },
    PreviousStepCallback (currentStep) {
      // console.log('[Vue Tour] A custom previousStep callback has been called on step ' + (currentStep + 1))
    },
    NextStepCallback (currentStep) {
      if (currentStep === 0) {
        showSidebar()
      }
    },
    StopCallback () {
      if (this.$tours['canvas'].isLast) {
        this.$cookies.set('vtour_fabric_canvas_finished', true)
      }
    }
  }
}
</script>

<style scoped lang="stylus">
  .custom-content-scroll
    max-width 350px
    word-wrap break-word
    // overflow scroll
</style>
