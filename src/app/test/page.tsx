'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Test with class component to see if lifecycle methods work
class TestClassComponent extends React.Component {
  constructor(props) {
    super(props);
    console.log('🏗️ TestClassComponent: Constructor called');
    this.state = {
      count: 0,
      mounted: false
    };
  }

  componentDidMount() {
    console.log('🚀 TestClassComponent: componentDidMount called!');
    this.setState({ mounted: true });
  }

  componentDidUpdate(prevProps, prevState) {
    console.log('🔄 TestClassComponent: componentDidUpdate called, count:', this.state.count);
  }

  componentWillUnmount() {
    console.log('🧹 TestClassComponent: componentWillUnmount called');
  }

  render() {
    console.log('🎨 TestClassComponent: render called, count:', this.state.count, 'mounted:', this.state.mounted);
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Class Component</h1>
        <p>Count: {this.state.count}</p>
        <p>Mounted: {this.state.mounted.toString()}</p>
        <button 
          onClick={() => this.setState(prevState => ({ count: prevState.count + 1 }))}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
        >
          Increment
        </button>
      </div>
    );
  }
}

// Export with SSR disabled to test client-side only rendering
const TestPageWithoutSSR = dynamic(() => Promise.resolve(TestClassComponent), {
  ssr: false,
  loading: () => <div>Loading client-side component...</div>
});

export default function TestPage() {
  return <TestPageWithoutSSR />;
}