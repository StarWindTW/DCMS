import { Button, Flex, Text, HStack, Avatar, Image, IconButton } from '@chakra-ui/react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FaDiscord } from 'react-icons/fa';
import { LuLogOut } from 'react-icons/lu';

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Button loading>Loading...</Button>;
  }

  if (session) {
    return (
      <Flex gap={4} alignItems="center">
        <HStack gap={3}>
          <Avatar.Root size="md">
            <Avatar.Image 
              src={session.user?.image || undefined}
              alt={session.user?.name || undefined}
            />
            <Avatar.Fallback>{session.user?.name?.charAt(0).toUpperCase()}</Avatar.Fallback>
          </Avatar.Root>
          <Text fontWeight="medium">{session.user?.name}</Text>
        </HStack>
        <IconButton variant="ghost" rounded="xl" onClick={() => signOut()} aria-label="登出">
          <LuLogOut />
        </IconButton>
      </Flex>
    );
  }

  return (
    <Button
      onClick={() => signIn('discord')}
      colorPalette="purple"
    >
      <FaDiscord />
      使用 Discord 登入
    </Button>
  );
}