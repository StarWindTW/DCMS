'use client';

import { Box, VStack, Text, HStack, Icon } from '@chakra-ui/react';
import { LuSend, LuHistory, LuLayoutDashboard } from 'react-icons/lu';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

export default function Sidebar({ onNavigate, currentPage }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: 'home', label: '主頁', icon: LuLayoutDashboard, path: '/' },
    { id: 'history', label: '歷史紀錄', icon: LuHistory, path: '/history' },
  ];

  const handleNavigation = (item: typeof menuItems[0]) => {
    if (onNavigate) {
      onNavigate(item.id);
    } else {
      router.push(item.path);
    }
  };

  return (
    <Box
      width="240px"
      height="100vh"
      bg="gray.50"
      borderRight="1px solid"
      borderColor="gray.200"
      position="fixed"
      left={0}
      top={0}
      p={4}
    >
      <VStack align="stretch" gap={2} mt={20}>
        {menuItems.map((item) => {
          const isActive = currentPage ? currentPage === item.id : pathname === item.path;
          return (
            <HStack
              key={item.id}
              gap={3}
              p={3}
              borderRadius="lg"
              cursor="pointer"
              bg={isActive ? 'blue.50' : 'transparent'}
              color={isActive ? 'blue.600' : 'gray.700'}
              _hover={{ bg: isActive ? 'blue.50' : 'gray.100' }}
              transition="all 0.2s"
              onClick={() => handleNavigation(item)}
            >
              <Icon fontSize="20px">
                <item.icon />
              </Icon>
              <Text fontWeight={isActive ? 'semibold' : 'medium'}>
                {item.label}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}
