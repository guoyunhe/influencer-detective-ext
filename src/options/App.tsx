import {
  Button,
  Code,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useEffect, useState, type FormEvent } from 'react';

import { DEFAULT_API_BASE, getApiBase, setApiBase } from './api';

export default function App() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getApiBase().then(setValue);
  }, []);

  function flash(message: string) {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3000);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = value.trim();
    if (!url) {
      flash('Please enter a URL.');
      return;
    }
    try {
      new URL(url);
    } catch {
      flash('Please enter a valid URL.');
      return;
    }
    setSaving(true);
    await setApiBase(url);
    setValue(await getApiBase());
    setSaving(false);
    flash('Saved.');
  }

  async function handleReset() {
    await setApiBase(DEFAULT_API_BASE);
    setValue(await getApiBase());
    flash('Reset to default.');
  }

  return (
    <Container size='sm' p='xl'>
      <Stack gap='md'>
        <Stack gap={4}>
          <Title order={2}>Settings</Title>
          <Text size='sm' c='dimmed'>
            Base URL of the Influencer Detector API. Defaults to <Code>{DEFAULT_API_BASE}</Code>.
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap='sm'>
            <TextInput
              label='API base URL'
              value={value}
              onChange={(event) => setValue(event.currentTarget.value)}
              placeholder={DEFAULT_API_BASE}
              type='url'
              autoComplete='off'
            />
            <Group>
              <Button type='submit' loading={saving}>
                Save
              </Button>
              <Button type='button' variant='default' onClick={handleReset}>
                Reset to default
              </Button>
            </Group>
            <Text size='sm' c='teal' style={{ minHeight: 18 }}>
              {status}
            </Text>
          </Stack>
        </form>

        <Divider />

        <Text size='xs' c='dimmed'>
          When the API runs on a different host, also add that host to <Code>host_permissions</Code>{' '}
          in <Code>manifest.json</Code> and reload the extension.
        </Text>
      </Stack>
    </Container>
  );
}
