export LDFLAGS=-Wl,-rpath=/var/task/
yum groupinstall "Development Tools" -y
yum install fontconfig-devel.x86_64 -y
yum erase cairo -y

export PKG_CONFIG_PATH='/usr/local/lib/pkgconfig'
export LD_LIBRARY_PATH='/usr/local/lib':$LD_LIBRARY_PATH

yum -y install zlib-devel

curl -L http://downloads.sourceforge.net/libpng/libpng-1.6.21.tar.xz -o libpng-1.6.21.tar.xz
tar -Jxf libpng-1.6.21.tar.xz && cd libpng-1.6.21
./configure --prefix=/var/task/project
make
make install
cd ..

curl http://www.ijg.org/files/jpegsrc.v8d.tar.gz -o jpegsrc.tar.gz
tar -zxf jpegsrc.tar.gz && cd jpeg-8d/
./configure --disable-dependency-tracking --prefix=/var/task/project
make
make install
cd ..

curl -L http://www.cairographics.org/releases/pixman-0.34.0.tar.gz -o pixman-0.34.0.tar.gz
tar -zxf pixman-0.34.0.tar.gz && cd pixman-0.34.0/
./configure --prefix=/var/task/project
make
make install
cd ..

curl -L http://download.savannah.gnu.org/releases/freetype/freetype-2.6.tar.gz -o freetype-2.6.tar.gz
tar -zxf freetype-2.6.tar.gz && cd freetype-2.6/
./configure --prefix=/var/task/project
make
make install
cd ..

curl https://www.freedesktop.org/software/fontconfig/release/fontconfig-2.12.0.tar.bz2 -o fontconfig.gz

yum install libpng-devel -y

curl -L http://cairographics.org/releases/cairo-1.14.6.tar.xz -o cairo-1.14.6.tar.xz
tar -Jxf cairo-1.14.6.tar.xz && cd cairo-1.14.6
PKG_CONFIG_PATH=/var/task/project/lib/pkgconfig
PKG_CONFIG=/var/task/project/lib/pkgconfig
./configure --disable-dependency-tracking --without-x --prefix=/var/task/project
make
make install
cd ..

yum install giflib-devel -y

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.4/install.sh | bash

nvm install 4.3

PKG_CONFIG_PATH=/var/task/project/lib/pkgconfig:/usr/local/lib/pkgconfig


# Gave up moment
yum install cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel

# Copy the pango dependencies
cp /usr/lib64/libpango*.so.* /var/task/project/lib/
cp /usr/lib64/libpango*.so /var/task/project/lib/