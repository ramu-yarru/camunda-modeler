/* global sinon */

import React from 'react';

import { mount } from 'enzyme';

import {
  Cache,
  WithCachedState
} from '../../../cached';

import {
  DmnEditor
} from '../DmnEditor';

import DmnModeler from 'test/mocks/dmn-js/Modeler';

import { SlotFillRoot } from 'src/app/slot-fill';

import diagramXML from './diagram.dmn';

const { spy } = sinon;


describe('<DmnEditor>', function() {

  it('should render', function() {
    const {
      instance
    } = renderEditor(diagramXML);

    expect(instance).to.exist;
  });


  describe('caching behavior', function() {

    let createSpy;

    beforeEach(function() {
      createSpy = sinon.spy(DmnEditor, 'createCachedState');
    });

    afterEach(function() {
      createSpy.restore();
    });


    it('should create modeler if not cached', function() {

      // when
      const {
        instance
      } = renderEditor(diagramXML);

      // then
      const {
        modeler
      } = instance.getCached();

      expect(modeler).to.exist;
      expect(createSpy).to.have.been.calledOnce;
    });


    it('should use cached modeler', function() {

      // given
      const cache = new Cache();

      cache.add('editor', {
        cached: {
          modeler: new DmnModeler()
        },
        __destroy: () => {}
      });

      // when
      renderEditor(diagramXML, {
        id: 'editor',
        cache
      });

      // then
      expect(createSpy).not.to.have.been.called;
    });

  });


  it('#getXML', async function() {
    const {
      instance
    } = renderEditor(diagramXML);

    const xml = await instance.getXML();

    expect(xml).to.exist;
    expect(xml).to.eql(diagramXML);
  });


  describe('#exportAs', function() {

    let instance;

    beforeEach(function() {
      instance = renderEditor(diagramXML).instance;
    });


    it('svg', async function() {
      const contents = await instance.exportAs('svg');

      expect(contents).to.exist;
      expect(contents).to.equal('<svg />');
    });


    it('png', async function() {
      const contents = await instance.exportAs('png');

      expect(contents).to.exist;
      expect(contents).to.contain('data:image/png');
    });


    it('jpeg', async function() {
      const contents = await instance.exportAs('jpeg');

      expect(contents).to.exist;
      expect(contents).to.contain('data:image/jpeg');
    });

  });


  describe('layout', function() {

    it('should open properties panel', function() {

      // given
      let layout = {
        propertiesPanel: {
          open: false
        }
      };

      function onLayoutChanged(newLayout) {
        layout = newLayout;
      }

      const {
        wrapper
      } = renderEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(layout.propertiesPanel.open).to.be.true;
    });


    it('should close properties panel', function() {

      // given
      let layout = {
        propertiesPanel: {
          open: true
        }
      };

      function onLayoutChanged(newLayout) {
        layout = newLayout;
      }

      const {
        wrapper
      } = renderEditor(diagramXML, {
        layout,
        onLayoutChanged
      });

      const toggle = wrapper.find('.toggle');

      // when
      toggle.simulate('click');

      // then
      expect(layout.propertiesPanel.open).to.be.false;
    });


    it('should handle missing layout', function() {

      // given
      let layout = { };

      // then
      renderEditor(diagramXML, {
        layout
      });

    });

  });


  describe('errors', function() {

    it('should handle XML export', async function() {
      // given
      const errorSpy = spy();

      const {
        instance
      } = renderEditor('export-error', {
        onError: errorSpy
      });

      let err;

      // when
      try {
        await instance.getXML();
      } catch (e) {
        err = e;
      }

      // then
      expect(err).to.exist;
      expect(errorSpy).to.have.been.calledOnce;
    });


    it('should handle image export error', async function() {
      // given
      const errorSpy = spy();

      const {
        instance
      } = renderEditor('export-as-error', {
        onError: errorSpy
      });

      let err;

      // when
      try {
        await instance.exportAs('svg');
      } catch (e) {
        err = e;
      }

      // then
      expect(err).to.exist;
      expect(errorSpy).to.have.been.calledOnce;
    });

  });


  describe('import', function() {

    it('should import without errors and warnings', function() {

      // given
      const importSpy = spy();

      // when
      renderEditor(diagramXML, {
        onImport: importSpy
      });

      // then
      expect(importSpy).to.have.been.calledWith(null, []);
    });


    it('should import with warnings', function() {

      // given
      const importSpy = (error, warnings) => {

        // then
        expect(error).not.to.exist;

        expect(warnings).to.exist;
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.equal('warning');
      };

      // when
      renderEditor('import-warnings', {
        onImport: importSpy
      });
    });


    it('should import with error', function() {

      // given
      const importSpy = (error, warnings) => {

        // then
        expect(error).to.exist;
        expect(error.message).to.equal('error');

        expect(warnings).to.exist;
        expect(warnings).to.have.length(0);
      };

      // when
      renderEditor('import-error', {
        onImport: importSpy
      });
    });

  });

});


// helpers //////////////////////////////

function noop() {}

const TestEditor = WithCachedState(DmnEditor);

function renderEditor(xml, options = {}) {
  const {
    layout,
    onError,
    onImport,
    onLayoutChanged
  } = options;

  const slotFillRoot = mount(
    <SlotFillRoot>
      <TestEditor
        id={ options.id || 'editor' }
        xml={ xml }
        onLayoutChanged={ onLayoutChanged || noop }
        onError={ onError || noop }
        onImport={ onImport || noop }
        cache={ options.cache || new Cache() }
        layout={ layout || {
          minimap: {
            open: false
          },
          propertiesPanel: {
            open: true
          }
        } }
      />
    </SlotFillRoot>
  );

  const wrapper = slotFillRoot.find(DmnEditor);

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
  };
}