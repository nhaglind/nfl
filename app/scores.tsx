import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { getTodaySchedule } from 'app/espn';

function Team({
  color,
  score,
  index,
  logo,
  name,
  rank,
  record,
  teamId,
  winner,
  status,
}: any) {
  const faded = winner === false && status === 'Final';

  return (
    <Link href={`/${teamId}`}>
      <div className="flex flex-row justify-between px-4 py-2 h-[60px]">
        <div className="flex">
          <Image
            src={logo}
            alt={name}
            priority={index < 10}
            width={24}
            height={24}
            className={clsx('h-6 w-6 mt-[2px]', {
              'dark:invert': color === '000000',
            })}
          />
          <div className="flex flex-col ml-4 leading-4 gap-y-1">
            <p
              className={clsx('font-semibold', {
                'text-gray-500': faded,
                'text-black dark:text-white': !faded,
              })}
            >
              {rank !== 99 ? (
                <span className="text-sm uppercase font-normal text-gray-500 mr-2">
                  {rank}
                </span>
              ) : null}
              {name}
            </p>
            <p
              className={clsx('text-sm', {
                'text-gray-500 ml-2': faded,
                'text-gray-600 dark:text-gray-400 ml-2': !faded,
              })}
            >
              {record}
            </p>
          </div>
        </div>
        <div
          className={clsx('flex', {
            'text-gray-500': faded,
            'text-gray-900 dark:text-gray-100': !faded,
          })}
        >
          <p className="leading-normal font-semibold text-xl">{score}</p>
        </div>
      </div>
    </Link>
  );
}

export async function Scores() {
  const { games } = await getTodaySchedule();

  return (
    <div>
      {games.map((game: any, index: number) => {
        return (
          <div
            key={index}
            className={clsx('pb-2', {
              'border-b border-gray-200 dark:border-gray-800':
                index !== games.length - 1,
            })}
          >
            <p className="flex justify-end mr-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
              {game.status}
            </p>
            <Team index={index} status={game.status} {...game.homeTeam} />
            <Team index={index} status={game.status} {...game.awayTeam} />
          </div>
        );
      })}
    </div>
  );
}
