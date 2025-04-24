export default function CustomPaletteProvider(palette, create, elementFactory, lassoTool, handTool, globalConnect, translate) {
  this._palette = palette;
  this._create = create;
  this._elementFactory = elementFactory;
  this._lassoTool = lassoTool;
  this._handTool = handTool;
  this._globalConnect = globalConnect;
  this._translate = translate;

  palette.registerProvider(this);
}

CustomPaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'lassoTool',
  'handTool',
  'globalConnect',
  'translate'
];

CustomPaletteProvider.prototype.getPaletteEntries = function() {
  // Use instance variables directly instead of destructuring
  const create = this._create;
  const elementFactory = this._elementFactory;
  const lassoTool = this._lassoTool;
  const handTool = this._handTool;
  const globalConnect = this._globalConnect;
  const translate = this._translate || function(str) { return str; };

  function createAction(type, group, className, title, options) {
    function createListener(event) {
      const shape = elementFactory.createShape(Object.assign({ type }, options));
      create.start(event, shape);
    }

    return {
      group,
      className,
      title: translate(title),
      action: {
        dragstart: createListener,
        click: createListener
      }
    };
  }

  // Return only the specific palette entries we want to show
  return {
    'hand-tool': {
      group: 'tools',
      className: 'bpmn-icon-hand-tool',
      title: translate('Activate the hand tool'),
      action: {
        click: function(event) {
          handTool.activateHand(event);
        }
      }
    },
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: translate('Activate the lasso tool'),
      action: {
        click: function(event) {
          lassoTool.activateSelection(event);
        }
      }
    },
    'global-connect-tool': {
      group: 'tools',
      className: 'bpmn-icon-connection-multi',
      title: translate('Activate the connect tool'),
      action: {
        click: function(event) {
          globalConnect.toggle(event);
        }
      }
    },
    'tool-separator': {
      group: 'tools',
      separator: true
    },
    'create.start-event': createAction(
      'bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none',
      'Create StartEvent'
    ),
    'create.intermediate-event-catch-timer': createAction(
      'bpmn:IntermediateCatchEvent', 'event', 'bpmn-icon-intermediate-event-catch-timer',
      'Create Timer Intermediate Catch Event', 
      { eventDefinitionType: 'bpmn:TimerEventDefinition' }
    ),
    'create.intermediate-event-catch-message': createAction(
      'bpmn:IntermediateCatchEvent', 'event', 'bpmn-icon-intermediate-event-catch-message',
      'Create Message Intermediate Catch Event', 
      { eventDefinitionType: 'bpmn:MessageEventDefinition' }
    ),
    'create.end-event': createAction(
      'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none',
      'Create EndEvent'
    ),
    'create.exclusive-gateway': createAction(
      'bpmn:ExclusiveGateway', 'gateway', 'bpmn-icon-gateway-xor',
      'Create Exclusive Gateway'
    ),
    'create.inclusive-gateway': createAction(
      'bpmn:InclusiveGateway', 'gateway', 'bpmn-icon-gateway-or',
      'Create Inclusive Gateway'
    ),
    'create.parallel-gateway': createAction(
      'bpmn:ParallelGateway', 'gateway', 'bpmn-icon-gateway-parallel',
      'Create Parallel Gateway'
    ),
    'create.task': createAction(
      'bpmn:Task', 'activity', 'bpmn-icon-task',
      'Create Task'
    ),
    'create.participant-expanded': createAction(
      'bpmn:Participant', 'collaboration', 'bpmn-icon-participant',
      'Create Pool/Participant', { isExpanded: true }
    )
    // Removed:
    // - 'create.service-task'
    // - 'create.user-task'
    // Other explicitly excluded items:
    // - subprocess-expanded
    // - data objects
    // - groups
  };
}; 