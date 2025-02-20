import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const translations = {
  en: {
    title: 'PAGES AI',
    placeholder: 'Describe your landing page...',
    generate: 'Generate'
  },
  pt: {
    title: 'PAGES AI',
    placeholder: 'Descreva sua landing page...',
    generate: 'Gerar'
  }
};

const defaultComponents = {
  hero: (content) => (
    <section className="bg-white py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-4">{content.title}</h1>
      <p className="text-xl text-center text-gray-600">{content.subtitle}</p>
    </section>
  ),
  cta: (content) => (
    <section className="bg-indigo-600 py-8 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">{content.title}</h2>
        <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
          {content.buttonText}
        </button>
      </div>
    </section>
  ),
  testimonials: (content) => (
    <section className="bg-gray-50 py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-8">{content.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {content.items.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 mb-4">"{item.text}"</p>
            <p className="font-bold">{item.author}</p>
          </div>
        ))}
      </div>
    </section>
  )
};

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [components, setComponents] = useState([]);
  const [language, setLanguage] = useState('pt');
  const t = translations[language];

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement AI processing of the prompt
    // For now, we'll add a placeholder component
    const newComponent = {
      id: `component-${components.length}`,
      type: 'section',
      content: prompt
    };
    setComponents([...components, newComponent]);
    setPrompt('');
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(components);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setComponents(items);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="ml-4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="pt">Português</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handlePromptSubmit} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t.generate}
              </button>
            </div>
          </form>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="page-components">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {components.map((component, index) => (
                    <Draggable
                      key={component.id}
                      draggableId={component.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white p-4 rounded-lg shadow"
                        >
                          {component.content}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </main>
    </div>
  );
};

export default App;