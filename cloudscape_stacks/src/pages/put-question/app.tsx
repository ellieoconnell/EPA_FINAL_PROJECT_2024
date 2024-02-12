import React, {useState} from 'react';
import axios from 'axios';
import Button from '@cloudscape-design/components/button';
import Form from '@cloudscape-design/components/form';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import { Flashbar } from '@cloudscape-design/components';

import Breadcrumbs from '../../components/breadcrumbs';
import Navigation from '../../components/navigation';
import ShellLayout from '../../layouts/shell';
import { Multiselect } from '@cloudscape-design/components';
import { OptionDefinition } from '@cloudscape-design/components/internal/components/option/interfaces';
import { error } from 'console';
import { createApiPath } from '../../utils/helper';

const url = createApiPath()

const api = url + '/put-question';

type FlashMessageType = {
  type: 'success';
  dismissible: boolean;
  dismissLabel: string;
  onDismiss: () => void;
  content: React.ReactNode;
  id: string;
} | {
  type: 'error';
  dismissible: boolean;
  dismissLabel: string;
  onDismiss: () => void;
  content: React.ReactNode;
  id: string;
} | null;

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState<readonly OptionDefinition[]>([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState<readonly OptionDefinition[]>([]);
  const [question, setQuestion] = useState('');
  const [flashMessage, setFlashMessage] = useState<FlashMessageType>(null);

  const handleSubmit = async (event:  React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validateForm()) {
      console.error('Please complete all required fields before submitting.');
      return;
    }

    const questionData = {
      level: selectedLevel.length > 0 ? selectedLevel[0].value : '',
      role: selectedJobTitle.length > 0 ? selectedJobTitle[0].value : '',
      question,
    };
  
      try {
        const response = await axios.put(api, questionData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Question submitted successfully:', response.data);

        setFlashMessage({
          type: 'success',
          dismissible: true,
          dismissLabel: 'Dismiss message',
          onDismiss: () => setFlashMessage(null),
          content: ' Question submitted successfully!',
          id: 'success_message',
        });

        setSelectedLevel([]);
        setSelectedJobTitle([]);
        setQuestion('');
      } catch (error: any) {
        console.error('Complete error object', error);
        console.log('Request Payload:', questionData);
        setFlashMessage({
          type: 'error',
          dismissible: true,
          dismissLabel: 'Dismiss message',
          onDismiss: () => setFlashMessage(null),
          content: 'Error submitting question. Please try again.',
          id: 'error_message',
        });
    
        if (error.response && error.response.status) {
          console.error('Response', error.response.status);
        }
      }
    };

    const validateForm = () => {
      return selectedLevel.length > 0 && selectedJobTitle.length > 0 && question.trim() !== '';
  };

  return (
    <ShellLayout
      contentType="form"
      breadcrumbs={<Breadcrumbs active={{ text: 'Create Question', href: '/put-question/index.html' }} />}
      navigation={<Navigation />}
    >
      <ContentLayout
        header={
          <Header
            variant="h1"
            description="Create a new question by specifying the job role and question. On creation a question will be added to the question bank."
          >
            Create Question
          </Header>
        }
      >
        <form onSubmit={handleSubmit}>
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button href="/tablepage/index.html" variant="link">
                  Cancel
                </Button>
                <Button formAction="submit" variant="primary">
                  Create Question
                </Button>
              </SpaceBetween>
            }
          >
          {flashMessage && <Flashbar items={[flashMessage]} />}
          <Container header={<Header variant="h2">Role Information</Header>}>
              <SpaceBetween direction="vertical" size="l">
                <FormField label="Job Level">
                  <Multiselect
                        selectedOptions={selectedLevel}
                        onChange={({ detail }) =>
                          setSelectedLevel(detail.selectedOptions)
                        }
                        options={[
                          {label: "Level 4", value: "Level 4"},
                          {label: "Level 5", value: "Level 5"},
                          {label: "Level 6", value: "Level 6"}
                        ]}
                        placeholder="Select the appropriate level"
                      />
                      </FormField>
                  <FormField label="Job Title">
                  <Multiselect
                        selectedOptions={selectedJobTitle}
                        onChange={({ detail }) =>
                          setSelectedJobTitle(detail.selectedOptions)
                        }
                        options={[
                          {label: "Systems Engineer", value: "Systems Engineer"},
                          {label: "Systems Development Engineer", value: "Systems Development Engineer"},
                          {label: "Support Engineer", value: "Support Engineer"},
                          {label: "Systems Analyst", value: "Systems Analyst"},
                        ]}
                        placeholder="Select the appropriate job title"
                      />
                </FormField>
              </SpaceBetween>
            </Container>
            <Container header={<Header variant="h2">Question</Header>}>
              <SpaceBetween direction="vertical" size="l"> 
                <FormField label="Question Detail" description="Define the question you want to add to the question bank.">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question"
                  />
                </FormField>
              </SpaceBetween>
            </Container>
          </Form>
        </form>
      </ContentLayout>
    </ShellLayout>
  );
}
