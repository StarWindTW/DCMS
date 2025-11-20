'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Spinner,
  Text,
} from '@chakra-ui/react';

interface ServerStats {
  serverId: string;
  serverName?: string;
  totalSignals: number;
  lastSignalTime: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<ServerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServerStats();
  }, []);

  const fetchServerStats = async () => {
    try {
      const response = await fetch('/api/admin/server-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch server stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <Box p={8}>
      <Heading mb={6}>伺服器數據統計</Heading>
      
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>伺服器 ID</Table.ColumnHeader>
            <Table.ColumnHeader>伺服器名稱</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">信號總數</Table.ColumnHeader>
            <Table.ColumnHeader>最後發送時間</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {stats.map((stat) => (
            <Table.Row key={stat.serverId}>
              <Table.Cell fontFamily="mono" fontSize="sm">{stat.serverId}</Table.Cell>
              <Table.Cell>{stat.serverName || '未知'}</Table.Cell>
              <Table.Cell textAlign="end" fontWeight="bold">{stat.totalSignals}</Table.Cell>
              <Table.Cell fontSize="sm">
                {new Date(stat.lastSignalTime).toLocaleString('zh-TW')}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {stats.length === 0 && (
        <Text textAlign="center" py={8} color="gray.500">
          尚無數據
        </Text>
      )}
    </Box>
  );
}
