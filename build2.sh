export LDFLAGS=-Wl,-rpath=/var/task/lib/
export PKG_CONFIG_PATH='/canvas/lib/pkgconfig'
export LD_LIBRARY_PATH='/canvas/lib':$LD_LIBRARY_PATH

C_INCLUDE_PATH=/canvas/include/
CPLUS_INCLUDE_PATH=/canvas/include/
export C_INCLUDE_PATH
export CPLUS_INCLUDE_PATH




curl -L http://downloads.sourceforge.net/libpng/libpng-1.6.21.tar.xz -o libpng-1.6.21.tar.xz
tar -Jxf libpng-1.6.21.tar.xz && cd libpng-1.6.21
./configure --prefix=/canvas
make
make install
cd ..

curl http://www.ijg.org/files/jpegsrc.v8d.tar.gz -o jpegsrc.v8d.tar.gz
tar -zxf jpegsrc.v8d.tar.gz && cd jpeg-8d/
./configure --disable-dependency-tracking --prefix=/canvas
make
make install


curl -L http://www.cairographics.org/releases/pixman-0.34.0.tar.gz -o pixman-0.34.0.tar.gz
tar -zxf pixman-0.34.0.tar.gz && cd pixman-0.34.0/
./configure --prefix=/canvas
make
make install

curl -L http://download.savannah.gnu.org/releases/freetype/freetype-2.6.tar.gz -o freetype-2.6.tar.gz
tar -zxf freetype-2.6.tar.gz && cd freetype-2.6/
./configure --prefix=/canvas
make
make install

curl -L http://cairographics.org/releases/cairo-1.14.6.tar.xz -o cairo-1.14.6.tar.xz
tar -Jxf cairo-1.14.6.tar.xz && cd cairo-1.14.6
./configure --disable-dependency-tracking --without-x --prefix=/canvas
make
make install

curl -L http://downloads.sourceforge.net/giflib/giflib-5.1.3.tar.bz2 -o giflib-5.1.3.tar.bz2
tar -xvjf giflib-5.1.3.tar.bz2 && cd giflib-5.1.3
./configure --prefix=/canvas
make
make install

curl -L http://xmlsoft.org/sources/libxml2-2.9.3.tar.gz -o libxml2-2.9.3.tar.gz
tar -zxf libxml2-2.9.3.tar.gz && cd libxml2-2.9.3
./configure --prefix=/canvas
make
make install


curl -L http://www.freedesktop.org/software/fontconfig/release/fontconfig-2.11.1.tar.bz2 -o fontconfig-2.11.1.tar.bz2
tar -xvjf fontconfig-2.11.1.tar.bz2 && cd fontconfig-2.11.1
./configure --prefix=/canvas  --enable-libxml2
make
make install